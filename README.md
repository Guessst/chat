# Create Docker Container for RabbitMQ
docker run -d --hostname rabbitmq --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:management

# Run Docker Container for RabbitMQ
docker start rabbitmq

# Compose for local testing
docker compose --env-file .env.development.docker up --build