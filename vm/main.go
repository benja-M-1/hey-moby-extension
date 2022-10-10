package main

import (
	"flag"
	"log"
	"net"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	var socketPath string
	flag.StringVar(&socketPath, "socket", "/run/guest/volumes-service.sock", "Unix domain socket to listen on")
	flag.Parse()

	os.RemoveAll(socketPath)

	router := echo.New()
	router.HideBanner = true
	router.Use(middleware.Logger())

	ln, err := net.Listen("unix", socketPath)
	if err != nil {
		log.Fatal(err)
	}
	router.Listener = ln

	openaiAPIKey := os.Getenv("OPENAI_API_KEY")

	proxiedURL, _ := url.Parse("https://api.openai.com")
	proxy := httputil.NewSingleHostReverseProxy(proxiedURL)

	proxyPrefix := "/openai"
	group := router.Group(proxyPrefix)
	group.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(context echo.Context) error {
			req := context.Request()
			res := context.Response().Writer

			// Update the headers to allow for SSL redirection
			req.Host = proxiedURL.Host
			req.URL.Host = proxiedURL.Host
			req.URL.Scheme = proxiedURL.Scheme
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+openaiAPIKey)

			// trim reverseProxyRoutePrefix
			path := req.URL.Path
			req.URL.Path = strings.ReplaceAll(path, proxyPrefix, "/v1")

			log.Printf("Send request to %s", req.URL.String())

			// ServeHttp is non blocking and uses a go routine under the hood
			proxy.ServeHTTP(res, req)

			return nil
		}
	})

	log.Fatal(router.Start(""))
}
