# Step 1: Generate cargo-chef recipe
FROM rust:1.90-slim AS planner
WORKDIR /app
RUN cargo install cargo-chef
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Step 2: Cache dependencies
FROM rust:1.90-slim AS cacher
WORKDIR /app
RUN apt-get update && apt-get install -y
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# Step 3: Build the binaries
FROM rust:1.90-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y

# Copy the entire source code first
COPY . .
# Then copy the cached dependencies (this will overwrite the empty target dir)
COPY --from=cacher /app/target target
COPY --from=cacher /usr/local/cargo /usr/local/cargo

RUN cargo build --release --bin server

# Final runtime stage
FROM debian:bookworm-slim AS runtime
WORKDIR /app
COPY --from=builder /app/target/release/server /app/server