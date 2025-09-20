# Chat


## Development workflow - local without Docker
```bash
cd backend
dotnet run

cd frontend
npm run dev
```

## Development workflow - local with Docker
Compose for local testing:
```bash
docker compose --env-file .env.development.docker up --build
```

## Env files explanation
- ```.env.development```: For running locally without docker
- ```.env.development.docker```: For running locally with docker
- ```.env.production```: For running in production

