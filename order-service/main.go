package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/hashicorp/go-uuid"
)

type Order struct {
	ID      string   `json:"id"`
	ItemIDs []string `json:"item_ids"`
	Status  string   `json:"status"`
}

var orders = make(map[string]Order)

const contentTypeJSON = "application/json"

// Service registration with Consul using the HTTP API (no Consul Go client required).
func registerServiceWithConsul() {
	consulURL := "http://consul:8500/v1/agent/service/register"

	registration := map[string]interface{}{
		"ID":      "order-service",
		"Name":    "order-service",
		"Address": "order-service",
		"Port":    8081,
		"Check": map[string]interface{}{
			"HTTP":     "http://order-service:8081/health",
			"Interval": "10s",
			"Timeout":  "1s",
		},
	}

	body, err := json.Marshal(registration)
	if err != nil {
		log.Printf("Warning: failed to marshal Consul registration: %v", err)
		return
	}

	req, err := http.NewRequest(http.MethodPut, consulURL, bytes.NewReader(body))
	if err != nil {
		log.Printf("Warning: Could not create Consul registration request: %v", err)
		return
	}
	req.Header.Set("Content-Type", contentTypeJSON)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Warning: Could not register with Consul: %v", err)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		log.Printf("Warning: Consul registration failed: status=%d body=%s", resp.StatusCode, string(respBody))
		return
	}
	log.Println("Successfully registered service with Consul")
}

// Use direct service discovery for Docker Compose
func findService(serviceName string) (string, error) {
	switch serviceName {
	case "food-catalog-service":
		return "http://food-catalog-service:8080", nil
	default:
		return "", fmt.Errorf("unknown service: %s", serviceName)
	}
}

func main() {
	// Try to register with Consul, but don't fail if it's not available
	go registerServiceWithConsul()

	r := chi.NewRouter()
	r.Use(middleware.Logger)

	// Simple CORS middleware so browser preflight (OPTIONS) succeeds
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	r.Post("/orders", func(w http.ResponseWriter, r *http.Request) {
		var newOrder Order
		if err := json.NewDecoder(r.Body).Decode(&newOrder); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Example of inter-service communication
		catalogAddr, err := findService("food-catalog-service")
		if err != nil {
			http.Error(w, "Food catalog service not available", http.StatusInternalServerError)
			log.Printf("Error finding catalog service: %v", err)
			return
		}
		log.Printf("Found food-catalog-service at: %s. Would validate items here.", catalogAddr)

		orderID, _ := uuid.GenerateUUID()
		newOrder.ID = orderID
		newOrder.Status = "received"
		orders[orderID] = newOrder

		w.Header().Set("Content-Type", contentTypeJSON)
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(newOrder)
	})

	r.Get("/orders", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", contentTypeJSON)
		json.NewEncoder(w).Encode(orders)
	})

	log.Println("Order Service starting on port 8081...")
	http.ListenAndServe(":8081", r)
}
