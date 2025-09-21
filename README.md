# Serwis Prawny 21-9-2025

## Opis projektu

**Serwis Prawny 21-9-2025** to nowoczesna platforma programistyczna, której celem jest cyfryzacja usług prawnych i automatyzacja procesów związanych z obsługą prawną. Projekt został zaprojektowany z myślą o kancelariach prawnych, firmach oraz klientach indywidualnych, którzy poszukują szybkiego i profesjonalnego wsparcia w zakresie prawa, dokumentów oraz komunikacji z ekspertami.

Repozytorium publiczne: [serwis_prawny21-9-2025](https://github.com/rrsartneoai/serwis_prawny21-9-2025)

---

## Drzewo projektu

```
serwis_prawny21-9-2025/
│
├── app/                       # Backend FastAPI
│   ├── main.py                # Główna aplikacja FastAPI
│   ├── api/                   # Endpointy API
│   │   └── v1/
│   │       ├── endpoints/
│   │       └── schemas/
│   ├── core/                  # Konfiguracje, bezpieczeństwo
│   ├── db/                    # Obsługa bazy danych
│   ├── models/                # Modele SQLAlchemy
│   └── tests/                 # Testy jednostkowe
│
├── frontend/                  # Frontend Next.js
│   ├── package.json           # Zależności frontendu
│   ├── lib/                   # Logika komunikacji z backendem
│   ├── pages/                 # Strony aplikacji
│   ├── components/            # Komponenty UI
│   └── public/                # Statyczne zasoby
│
├── requirements.txt           # Zależności backendu (Python)
├── README.md                  # Dokumentacja techniczna
├── OPIS.md                    # Opis projektu i dokumentacja biznesowa
├── openapi.yaml               # Specyfikacja OpenAPI
├── .replit                    # Konfiguracja Replit
├── replit.md                  # Instrukcja i opis konfiguracji
└── sdk/                       # Generowany SDK (klient)
    ├── python/
    └── js/
```

---

## Główne funkcjonalności

1. **Generowanie i obsługa dokumentów prawnych**
   - Automatyczne generowanie dokumentów (umowy, pisma, wnioski)
   - Edycja i wersjonowanie dokumentów
   - Elektroniczne archiwum dokumentów

2. **System komunikacji z prawnikiem**
   - Bezpieczna komunikacja tekstowa oraz wideo
   - Integracja z powiadomieniami i kalendarzem spotkań

3. **Panel klienta oraz kancelarii**
   - Zarządzanie sprawami, dokumentacją i kontaktami
   - Automatyczna klasyfikacja spraw według statusu i rodzaju

4. **Automatyzacja procesów prawnych**
   - Wykorzystanie AI do analizy dokumentów oraz wsparcia merytorycznego
   - Szybkie wyszukiwanie aktów prawnych i interpretacji

5. **Bezpieczeństwo i zgodność z RODO**
   - Szyfrowanie danych
   - Pełna zgodność z przepisami RODO i wymogami bezpieczeństwa informacji

---

## Architektura techniczna

- **Język programowania:** TypeScript (frontend), Python (backend)
- **Struktura repozytorium:** Monorepo z podziałem na frontend (`/frontend`, Next.js) i backend (`/app`, FastAPI)
- **Front-end:** Nowoczesny interfejs użytkownika oparty o Next.js, React, Tailwind CSS, shadcn/ui
- **Back-end:** API w FastAPI, SQLAlchemy ORM, Pydantic (walidacja), JWT (autoryzacja)
- **Baza danych:** SQLite (możliwość rozbudowy)
- **Integracje:** Supabase, możliwość podłączenia z zewnętrznymi usługami prawnymi oraz AI

---

## Zastosowanie

Serwis dedykowany jest dla:
- Kancelarii prawnych i doradców
- Firm i działów HR/Compliance
- Klientów indywidualnych szukających szybkiego wsparcia prawnego

---

## Instalacja i uruchomienie

### Instalacja Frontendu

1. Skopiuj repozytorium:
   ```bash
   git clone https://github.com/rrsartneoai/serwis_prawny21-9-2025.git
   ```
2. Przejdź do katalogu frontend:
   ```bash
   cd serwis_prawny21-9-2025/frontend
   ```
3. Zainstaluj zależności:
   ```bash
   npm install
   ```
   lub (jeśli używasz pnpm):
   ```bash
   pnpm install
   ```
4. Uruchom aplikację frontendową:
   ```bash
   npm run dev
   ```
   Domyślnie frontend działa na porcie `5000`.

---

### Instalacja Backend-u

1. Przejdź do katalogu backendu:
   ```bash
   cd serwis_prawny21-9-2025/app
   ```
2. Utwórz i aktywuj środowisko wirtualne (zalecane):
   - Linux/macOS:
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```
   - Windows:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
3. Zainstaluj zależności backendu:
   ```bash
   pip install -r ../requirements.txt
   ```
4. Uruchom backend FastAPI:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Backend domyślnie działa na porcie `8000`.

---

## Dostęp do aplikacji

- **Frontend:** http://localhost:5000
- **Backend API:** http://localhost:8000
- **Dokumentacja Swagger:** http://localhost:8000/api/v1/docs

---

## Wkład i rozwój projektu

Projekt jest otwarty na współpracę i rozwój. Zachęcamy do zgłaszania problemów, propozycji nowych funkcji oraz udziału w rozwoju kodu.

---

## Licencja

Brak zdefiniowanej licencji. W przypadku chęci komercyjnego wykorzystania, skontaktuj się z właścicielem repozytorium.

---

## Kontakt

Właściciel repozytorium: [rrsartneoai](https://github.com/rrsartneoai)

---
