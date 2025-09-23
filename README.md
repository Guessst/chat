# Chat


## Development workflow - local without Docker
```bash
cd backend
dotnet run

cd frontend
npm run dev
```

> [!WARNING]
> This requires 2 containers, one for the DB and for RabbitMQ. I suggest running the `docker compose` command for 'local with docker' and then spinning up just these 2 containers.


## Development workflow - local with Docker
Compose for local testing:
```bash
docker compose --env-file .env.development.docker up --build
```

## Env files explanation
- ```.env.development```: For running locally without docker
- ```.env.development.docker```: For running locally with docker
- ```.env.production```: For running in production

