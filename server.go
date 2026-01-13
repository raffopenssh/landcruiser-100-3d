package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
)

var (
	visitCount int
	countFile  = "visit_count.txt"
	mu         sync.Mutex
)

func loadCount() {
	data, err := os.ReadFile(countFile)
	if err != nil {
		visitCount = 0
		return
	}
	fmt.Sscanf(string(data), "%d", &visitCount)
}

func saveCount() {
	os.WriteFile(countFile, []byte(fmt.Sprintf("%d", visitCount)), 0644)
}

func visitHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
	mu.Lock()
	visitCount++
	saveCount()
	count := visitCount
	mu.Unlock()
	
	json.NewEncoder(w).Encode(map[string]int{"count": count})
}

func getCountHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
	mu.Lock()
	count := visitCount
	mu.Unlock()
	
	json.NewEncoder(w).Encode(map[string]int{"count": count})
}

func main() {
	loadCount()
	
	// Get the directory of the executable
	dir, _ := filepath.Abs(".")
	
	// API endpoints
	http.HandleFunc("/api/visit", visitHandler)
	http.HandleFunc("/api/count", getCountHandler)
	
	// Serve static files
	fs := http.FileServer(http.Dir(dir))
	http.Handle("/", fs)
	
	fmt.Println("Server starting on :8001")
	fmt.Printf("Initial visit count: %d\n", visitCount)
	http.ListenAndServe(":8001", nil)
}
