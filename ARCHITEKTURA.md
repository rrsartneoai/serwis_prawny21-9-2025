# Architektura systemu

Serwis Prawny 21-9-2025 jest zbudowany w architekturze monorepo, łączącej frontend (Next.js + React), backend (FastAPI) oraz SDK klienckie.

## Warstwy systemu

- **Frontend** (`/frontend`): Next.js, React, Tailwind CSS, shadcn/ui.
  - UI, komunikacja z API, panel użytkownika/kancelarii.
- **Backend** (`/app`): FastAPI, SQLAlchemy, Pydantic, JWT.
  - API REST, zarządzanie użytkownikami, sprawami, dokumentacją, AI.
- **Baza danych**: SQLite, z opcją rozbudowy (np. PostgreSQL).
- **Integracje**: Supabase (autentykacja), Stripe (płatności), OpenAI/HuggingFace (AI), zewnętrzne usługi prawne.
- **SDK** (`/sdk`): Biblioteki JS/Python do integracji z API.

## Schemat katalogów

```
serwis_prawny21-9-2025/
├── app/            # Backend FastAPI
├── frontend/       # Frontend Next.js
├── sdk/            # SDK kliencki
├── openapi.yaml    # Specyfikacja API
└── ...             # Inne pliki narzędziowe i dokumentacyjne
```

## Kluczowe pliki

- `app/main.py` – uruchamia serwer API
- `frontend/pages/` – strony aplikacji
- `sdk/python/`, `sdk/js/` – biblioteki klienckie

## Bezpieczeństwo

- Szyfrowanie danych
- Pełna zgodność z RODO
- Audyt bezpieczeństwa
