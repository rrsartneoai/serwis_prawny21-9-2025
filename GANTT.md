# Przykładowy wykres Gantta wdrożenia

```mermaid
gantt
    title Wdrożenie Serwis Prawny 21-9-2025
    dateFormat  YYYY-MM-DD
    section Backend
    Projekt API        :done, 2025-09-01, 2025-09-15
    Integracje AI      :active, 2025-09-16, 2025-10-15
    Bezpieczeństwo     :2025-09-20, 2025-10-05
    section Frontend
    UI/UX              :done, 2025-09-01, 2025-09-10
    Panel klienta      :active, 2025-09-11, 2025-09-30
    Komunikacja z API  :2025-09-16, 2025-10-05
    section Integracje
    Stripe/BLIK        :2025-09-21, 2025-10-10
    Supabase           :done, 2025-09-01, 2025-09-07
    section Testy i wdrożenie
    Testy automatyczne :2025-10-01, 2025-10-15
    Wdrożenie produkcyjne :2025-10-15, 2025-10-20
```