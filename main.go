package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	hub = newHub()
)

func main() {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.yaml"
	}

	config, err := LoadConfig(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			log.Printf("Config file not found, using defaults and environment variables")
			config, err = LoadConfig("")
			if err != nil {
				log.Fatalf("Failed to load configuration: %v", err)
			}
		} else {
			log.Fatalf("Failed to load configuration: %v", err)
		}
	}

	database, err := InitDB(config)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	userStore := NewUserStore(database)

	jwtService := NewJWTService(config.JWT.SecretKey)

	authHandler := NewAuthHandler(userStore, jwtService)

	r := gin.Default()

	r.Static("/static", "./static")
	r.LoadHTMLGlob("templates/*")

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", nil)
	})
	r.GET("/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", nil)
	})
	r.GET("/register", func(c *gin.Context) {
		c.HTML(http.StatusOK, "register.html", nil)
	})

	r.POST("/api/register", authHandler.Register)
	r.POST("/api/login", authHandler.Login)

	r.GET("/api/ws", func(c *gin.Context) {
		handleWebSocket(c, jwtService)
	})

	api := r.Group("/api")
	api.Use(authHandler.AuthMiddleware())
	{
		api.GET("/me", authHandler.GetMe)
	}

	go hub.run()

	log.Printf("Server starting on port %s", config.Server.Port)
	log.Fatal(http.ListenAndServe(":"+config.Server.Port, r))
}

func handleWebSocket(c *gin.Context, jwtService *JWTService) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
		return
	}

	tokenObj, err := jwtService.ValidateToken(token)
	if err != nil || !tokenObj.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	claims, ok := tokenObj.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	username, ok := claims["username"].(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	userInfo := &User{
		ID:       userID,
		Username: username,
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:      hub,
		conn:     conn,
		send:     make(chan []byte, 256),
		username: userInfo.Username,
		userID:   userInfo.ID,
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}
