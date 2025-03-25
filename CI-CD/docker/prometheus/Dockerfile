FROM prom/prometheus:latest

COPY CI-CD/docker/prometheus/prometheus.yml /etc/prometheus/prometheus.yml

EXPOSE 9090

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:9090/-/healthy || exit 1