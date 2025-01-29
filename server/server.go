package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math"
	"net"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
	grpcrecovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/pkg/errors"
	"github.com/soheilhy/cmux"
	"google.golang.org/grpc"

	storepb "github.com/usememos/memos/proto/gen/store"
	"github.com/usememos/memos/server/profile"
	apiv1 "github.com/usememos/memos/server/router/api/v1"
	"github.com/usememos/memos/server/router/frontend"
	"github.com/usememos/memos/server/router/rss"
	"github.com/usememos/memos/server/runner/memopayload"
	"github.com/usememos/memos/server/runner/s3presign"
	"github.com/usememos/memos/server/runner/version"
	"github.com/usememos/memos/store"
)

type Server struct {
	Secret  string
	Profile *profile.Profile
	Store   *store.Store

	echoServer *echo.Echo
	grpcServer *grpc.Server
}

type AIRequest struct {
	Question string     `json:"question"`
	Settings AISettings `json:"settings"`
}

type AISettings struct {
	APIProvider string  `json:"apiProvider"`
	Timeout     int     `json:"timeout"`
	MaxTokens   int     `json:"maxTokens"`
	Temperature float64 `json:"temperature"`
	MaxContext  int     `json:"maxContext"`
	Model       string  `json:"model"`
	APIKey      string  `json:"apiKey"`
	Proxy       string  `json:"proxy"`
	APIBaseURL  string  `json:"apiBaseUrl"`
	UserAgent   string  `json:"userAgent"`
}

type AIResponse struct {
	Answer string `json:"answer"`
	Error  string `json:"error,omitempty"`
}

func NewServer(ctx context.Context, profile *profile.Profile, store *store.Store) (*Server, error) {
	s := &Server{
		Store:   store,
		Profile: profile,
	}

	echoServer := echo.New()
	echoServer.Debug = true
	echoServer.HideBanner = true
	echoServer.HidePort = true
	echoServer.Use(middleware.Recover())
	s.echoServer = echoServer

	workspaceBasicSetting, err := s.getOrUpsertWorkspaceBasicSetting(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get workspace basic setting")
	}

	secret := "usememos"
	if profile.Mode == "prod" {
		secret = workspaceBasicSetting.SecretKey
	}
	s.Secret = secret

	// Register healthz endpoint.
	echoServer.GET("/healthz", func(c echo.Context) error {
		return c.String(http.StatusOK, "Service ready.")
	})

	// Serve frontend resources.
	frontend.NewFrontendService(profile, store).Serve(ctx, echoServer)

	rootGroup := echoServer.Group("")

	// Create and register RSS routes.
	rss.NewRSSService(s.Profile, s.Store).RegisterRoutes(rootGroup)

	grpcServer := grpc.NewServer(
		// Override the maximum receiving message size to math.MaxInt32 for uploading large resources.
		grpc.MaxRecvMsgSize(math.MaxInt32),
		grpc.ChainUnaryInterceptor(
			apiv1.NewLoggerInterceptor().LoggerInterceptor,
			grpcrecovery.UnaryServerInterceptor(),
			apiv1.NewGRPCAuthInterceptor(store, secret).AuthenticationInterceptor,
		))
	s.grpcServer = grpcServer

	apiV1Service := apiv1.NewAPIV1Service(s.Secret, profile, store, grpcServer)
	// Register gRPC gateway as api v1.
	if err := apiV1Service.RegisterGateway(ctx, echoServer); err != nil {
		return nil, errors.Wrap(err, "failed to register gRPC gateway")
	}

	s.setupRoutes()

	return s, nil
}

func (s *Server) Start(ctx context.Context) error {
	address := fmt.Sprintf("%s:%d", s.Profile.Addr, s.Profile.Port)
	listener, err := net.Listen("tcp", address)
	if err != nil {
		return errors.Wrap(err, "failed to listen")
	}

	muxServer := cmux.New(listener)
	go func() {
		grpcListener := muxServer.MatchWithWriters(cmux.HTTP2MatchHeaderFieldSendSettings("content-type", "application/grpc"))
		if err := s.grpcServer.Serve(grpcListener); err != nil {
			slog.Error("failed to serve gRPC", "error", err)
		}
	}()
	go func() {
		httpListener := muxServer.Match(cmux.HTTP1Fast(http.MethodPatch))
		s.echoServer.Listener = httpListener
		if err := s.echoServer.Start(address); err != nil {
			slog.Error("failed to start echo server", "error", err)
		}
	}()
	go func() {
		if err := muxServer.Serve(); err != nil {
			slog.Error("mux server listen error", "error", err)
		}
	}()
	s.StartBackgroundRunners(ctx)

	return nil
}

func (s *Server) Shutdown(ctx context.Context) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// Shutdown echo server.
	if err := s.echoServer.Shutdown(ctx); err != nil {
		slog.Error("failed to shutdown server", slog.String("error", err.Error()))
	}

	// Close database connection.
	if err := s.Store.Close(); err != nil {
		slog.Error("failed to close database", slog.String("error", err.Error()))
	}

	slog.Info("memos stopped properly")
}

func (s *Server) StartBackgroundRunners(ctx context.Context) {
	s3presignRunner := s3presign.NewRunner(s.Store)
	s3presignRunner.RunOnce(ctx)
	versionRunner := version.NewRunner(s.Store, s.Profile)
	versionRunner.RunOnce(ctx)
	memopayloadRunner := memopayload.NewRunner(s.Store)
	// Rebuild all memos' payload after server starts.
	memopayloadRunner.RunOnce(ctx)

	go s3presignRunner.Run(ctx)
	go versionRunner.Run(ctx)
}

func (s *Server) getOrUpsertWorkspaceBasicSetting(ctx context.Context) (*storepb.WorkspaceBasicSetting, error) {
	workspaceBasicSetting, err := s.Store.GetWorkspaceBasicSetting(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get workspace basic setting")
	}
	modified := false
	if workspaceBasicSetting.SecretKey == "" {
		workspaceBasicSetting.SecretKey = uuid.NewString()
		modified = true
	}
	if modified {
		workspaceSetting, err := s.Store.UpsertWorkspaceSetting(ctx, &storepb.WorkspaceSetting{
			Key:   storepb.WorkspaceSettingKey_BASIC,
			Value: &storepb.WorkspaceSetting_BasicSetting{BasicSetting: workspaceBasicSetting},
		})
		if err != nil {
			return nil, errors.Wrap(err, "failed to upsert workspace setting")
		}
		workspaceBasicSetting = workspaceSetting.GetBasicSetting()
	}
	return workspaceBasicSetting, nil
}

func (s *Server) setupRoutes() {
	// 添加 CORS 中间件
	s.echoServer.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:3001"}, // 替换为你的前端地址
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
		AllowCredentials: true,
	}))

	// 添加测试端点
	s.echoServer.POST("/api/ai/test", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"message": "Test endpoint working",
		})
	})

	s.echoServer.POST("/api/ai/chat", s.handleAIChat)
}

func (s *Server) handleAIChat(c echo.Context) error {
	var req AIRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, AIResponse{
			Error: "无效的请求格式: " + err.Error(),
		})
	}

	settings := req.Settings

	client := &http.Client{
		Timeout: time.Duration(settings.Timeout) * time.Second,
	}

	if settings.Proxy != "" {
		proxyURL, err := url.Parse(settings.Proxy)
		if err == nil {
			client.Transport = &http.Transport{
				Proxy: http.ProxyURL(proxyURL),
			}
		}
	}

	requestBody := map[string]interface{}{
		"messages": []map[string]string{
			{
				"role":    "user",
				"content": req.Question,
			},
		},
		"model":       settings.Model,
		"max_tokens":  settings.MaxTokens,
		"temperature": settings.Temperature,
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, AIResponse{
			Error: "请求准备失败: " + err.Error(),
		})
	}

	apiURL := settings.APIBaseURL + "chat/completions"
	request, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, AIResponse{
			Error: "创建请求失败: " + err.Error(),
		})
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+settings.APIKey)
	request.Header.Set("User-Agent", settings.UserAgent)

	response, err := client.Do(request)
	if err != nil {
		slog.Error("Failed to send request to DeepSeek", "error", err)
		return c.JSON(http.StatusInternalServerError, AIResponse{
			Error: "API 请求失败: " + err.Error(),
		})
	}
	defer response.Body.Close()

	// 读取并记录原始响应
	bodyBytes, err := io.ReadAll(response.Body)
	if err != nil {
		slog.Error("Failed to read response body", "error", err)
		return c.JSON(http.StatusInternalServerError, AIResponse{
			Error: "读取响应失败: " + err.Error(),
		})
	}

	// 记录 DeepSeek 的响应
	slog.Info("Received response from DeepSeek", "status", response.StatusCode, "body", string(bodyBytes))

	if response.StatusCode != http.StatusOK {
		return c.JSON(http.StatusInternalServerError, AIResponse{
			Error: fmt.Sprintf("DeepSeek API 返回错误状态码: %d, 响应: %s", response.StatusCode, string(bodyBytes)),
		})
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		slog.Error("Failed to parse response JSON", "error", err)
		return c.JSON(http.StatusInternalServerError, AIResponse{
			Error: "解析响应失败: " + err.Error(),
		})
	}

	answer := ""
	if choices, ok := result["choices"].([]interface{}); ok && len(choices) > 0 {
		if choice, ok := choices[0].(map[string]interface{}); ok {
			if message, ok := choice["message"].(map[string]interface{}); ok {
				if content, ok := message["content"].(string); ok {
					answer = content
				}
			}
		}
	}

	if answer == "" {
		slog.Error("No valid answer in response", "response", result)
		return c.JSON(http.StatusInternalServerError, AIResponse{
			Error: "未能从响应中获取有效答案",
		})
	}

	slog.Info("Successfully processed AI chat request", "answer_length", len(answer))
	return c.JSON(http.StatusOK, AIResponse{
		Answer: answer,
	})
}
