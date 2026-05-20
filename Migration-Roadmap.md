# SimpleToDoApp Migration Roadmap

## Muc Tieu

Chuyen SimpleToDoApp tu ASP.NET MVC/Razor sang kien truc tach rieng:

- Backend: ASP.NET Core Web API, Clean Architecture nhe, EF Core SQL Server, JWT authentication.
- Frontend: Web Client dung React + Tailwind hoac Angular + Tailwind.
- Auth: bo Session, chuyen sang JWT.
- Data flow: client goi API bang HTTP va gui token qua header `Authorization: Bearer <token>`.

Deadline muc tieu: **Thu Nam, 28/05/2026**.

## Project Structure De Xuat

```text
SimpleToDoApp/
├─ SimpleToDoApp.sln
├─ README.md
├─ .gitignore
│
├─ backend/
│  ├─ SimpleToDoApp.Api/
│  │  ├─ Controllers/
│  │  │  ├─ AuthController.cs
│  │  │  └─ TodosController.cs
│  │  ├─ Middleware/
│  │  ├─ Extensions/
│  │  │  ├─ AuthenticationExtensions.cs
│  │  │  ├─ CorsExtensions.cs
│  │  │  └─ SwaggerExtensions.cs
│  │  ├─ appsettings.json
│  │  ├─ appsettings.Development.json
│  │  └─ Program.cs
│  │
│  ├─ SimpleToDoApp.Application/
│  │  ├─ DTOs/
│  │  │  ├─ Auth/
│  │  │  │  ├─ LoginRequest.cs
│  │  │  │  ├─ RegisterRequest.cs
│  │  │  │  └─ AuthResponse.cs
│  │  │  └─ Todos/
│  │  │     ├─ TodoDto.cs
│  │  │     ├─ CreateTodoRequest.cs
│  │  │     ├─ UpdateTodoRequest.cs
│  │  │     └─ UpdateTodoStatusRequest.cs
│  │  ├─ Interfaces/
│  │  │  ├─ IAuthService.cs
│  │  │  ├─ ITodoService.cs
│  │  │  ├─ IJwtTokenService.cs
│  │  │  └─ IPasswordHasher.cs
│  │  └─ Services/
│  │     ├─ AuthService.cs
│  │     └─ TodoService.cs
│  │
│  ├─ SimpleToDoApp.Domain/
│  │  ├─ Entities/
│  │  │  ├─ Account.cs
│  │  │  └─ Todo.cs
│  │  └─ Enums/
│  │     ├─ TodoPriority.cs
│  │     └─ TodoStatus.cs
│  │
│  ├─ SimpleToDoApp.Infrastructure/
│  │  ├─ Data/
│  │  │  ├─ TodoDbContext.cs
│  │  │  └─ Migrations/
│  │  ├─ Security/
│  │  │  ├─ JwtTokenService.cs
│  │  │  └─ PasswordHasher.cs
│  │  └─ DependencyInjection.cs
│  │
│  └─ SimpleToDoApp.Tests/
│     ├─ AuthServiceTests.cs
│     └─ TodoServiceTests.cs
│
├─ clients/
│  ├─ react-client/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ App.tsx
│  │  │  │  └─ router.tsx
│  │  │  ├─ api/
│  │  │  │  ├─ httpClient.ts
│  │  │  │  ├─ authApi.ts
│  │  │  │  └─ todoApi.ts
│  │  │  ├─ auth/
│  │  │  │  ├─ AuthContext.tsx
│  │  │  │  ├─ ProtectedRoute.tsx
│  │  │  │  └─ authStorage.ts
│  │  │  ├─ features/
│  │  │  │  ├─ auth/
│  │  │  │  │  ├─ LoginPage.tsx
│  │  │  │  │  └─ RegisterPage.tsx
│  │  │  │  └─ todos/
│  │  │  │     ├─ TodoListPage.tsx
│  │  │  │     ├─ TodoDetailPage.tsx
│  │  │  │     ├─ TodoFormPage.tsx
│  │  │  │     ├─ TodoCalendarPage.tsx
│  │  │  │     └─ TodoBoardPage.tsx
│  │  │  ├─ components/
│  │  │  ├─ types/
│  │  │  │  ├─ auth.ts
│  │  │  │  └─ todo.ts
│  │  │  ├─ styles/
│  │  │  │  └─ index.css
│  │  │  └─ main.tsx
│  │  ├─ package.json
│  │  ├─ vite.config.ts
│  │  └─ tailwind.config.ts
│  │
│  └─ angular-client/
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ core/
│     │  │  │  ├─ guards/auth.guard.ts
│     │  │  │  ├─ interceptors/auth.interceptor.ts
│     │  │  │  └─ services/token-storage.service.ts
│     │  │  ├─ features/
│     │  │  │  ├─ auth/
│     │  │  │  │  ├─ login/
│     │  │  │  │  ├─ register/
│     │  │  │  │  └─ auth.service.ts
│     │  │  │  └─ todos/
│     │  │  │     ├─ todo-list/
│     │  │  │     ├─ todo-detail/
│     │  │  │     ├─ todo-form/
│     │  │  │     ├─ todo-calendar/
│     │  │  │     ├─ todo-board/
│     │  │  │     └─ todo.service.ts
│     │  │  ├─ shared/
│     │  │  ├─ models/
│     │  │  │  ├─ auth.model.ts
│     │  │  │  └─ todo.model.ts
│     │  │  ├─ app.routes.ts
│     │  │  └─ app.config.ts
│     │  └─ styles.css
│     ├─ angular.json
│     ├─ package.json
│     └─ tailwind.config.js
```

## Thu Tu Lam Viec

Nen lam backend truoc, frontend sau:

1. Backup/commit project MVC hien tai.
2. Tao solution structure moi.
3. Tach Domain va Infrastructure.
4. Lam Web API ket noi database.
5. Lam register/login.
6. Them password hashing.
7. Them JWT authentication.
8. Lam Todo REST API.
9. Test API bang Swagger/Postman.
10. Tao Web Client.
11. Noi frontend voi API.
12. Test end-to-end va viet README.

## Lich Lam Viec Den 28/05/2026

### 20/05 - Ngay 1: Chuan Bi Va Tao Cau Truc Moi

- Backup hoac commit project MVC hien tai.
- Tao branch moi, vi du `migration-webapi-client`.
- Tao folder `backend/` va `clients/`.
- Tao cac project backend:
  - `SimpleToDoApp.Api`
  - `SimpleToDoApp.Application`
  - `SimpleToDoApp.Domain`
  - `SimpleToDoApp.Infrastructure`
  - `SimpleToDoApp.Tests`
- Cau hinh project references.

Ket qua cuoi ngay:

- Solution build duoc.
- Cac project backend tham chieu dung nhau.
- Chua can viet nhieu logic.

### 21/05 - Ngay 2: Di Chuyen Domain Va Database

- Chuyen `Account`, `Todo` sang `Domain/Entities`.
- Chuyen `TodoDbContext` sang `Infrastructure/Data`.
- Cau hinh EF Core SQL Server trong `Infrastructure`.
- Ket noi `Api` voi `Infrastructure`.
- Bat Swagger.
- Tao endpoint test:

```http
GET /api/health
```

Ket qua cuoi ngay:

- Web API chay duoc.
- Ket noi database thanh cong.
- Swagger mo duoc.

### 22/05 - Ngay 3: Auth Register/Login Va Password Hash

- Tao DTO:
  - `RegisterRequest`
  - `LoginRequest`
  - `AuthResponse`
- Tao interfaces:
  - `IAuthService`
  - `IPasswordHasher`
- Tao services:
  - `AuthService`
  - `PasswordHasher`
- Lam API:

```http
POST /api/auth/register
POST /api/auth/login
```

- Register phai hash password truoc khi luu.
- Login phai verify password hash.

Ket qua cuoi ngay:

- Register user moi duoc.
- Login dung/sai tra ket qua dung.
- Chua bat buoc JWT hoan chinh neu chua kip.

### 23/05 - Ngay 4: JWT Authentication

- Them cau hinh JWT trong `appsettings.json`:
  - `Jwt:Issuer`
  - `Jwt:Audience`
  - `Jwt:Key`
  - `Jwt:ExpiresInMinutes`
- Tao:
  - `IJwtTokenService`
  - `JwtTokenService`
- Login thanh cong tra token.
- Cau hinh `AddAuthentication().AddJwtBearer(...)`.
- Test endpoint co `[Authorize]`.

API can co:

```http
POST /api/auth/login
GET /api/auth/me
```

Ket qua cuoi ngay:

- Login tra JWT.
- Gui JWT goi duoc protected API.
- Khong co token thi bi `401`.

### 24/05 - Ngay 5: Todo REST API

- Tao DTO:
  - `TodoDto`
  - `CreateTodoRequest`
  - `UpdateTodoRequest`
  - `UpdateTodoStatusRequest`
- Tao:
  - `ITodoService`
  - `TodoService`
- Lam API:

```http
GET /api/todos
GET /api/todos/{id}
POST /api/todos
PUT /api/todos/{id}
DELETE /api/todos/{id}
PATCH /api/todos/{id}/status
GET /api/todos/calendar
```

Quy tac quan trong:

- Client khong duoc gui `userId`.
- Backend lay `userId` tu JWT.
- User chi xem/sua/xoa duoc Todo cua chinh minh.

Ket qua cuoi ngay:

- Todo API hoat dong day du bang Swagger/Postman.
- Day la milestone backend quan trong nhat.

### 25/05 - Ngay 6: Tao Web Client Va Auth UI

Khuyen nghi dung **React + Vite + Tailwind** de kip deadline.

- Tao `clients/react-client`.
- Cai Tailwind.
- Tao routing.
- Tao API layer:
  - `httpClient.ts`
  - `authApi.ts`
  - `todoApi.ts`
- Tao auth storage/token handling.
- Lam UI:
  - Login page
  - Register page
  - ProtectedRoute
  - Logout

Ket qua cuoi ngay:

- Frontend goi duoc API login/register.
- Login xong luu token.
- Route todo bi chan neu chua login.

### 26/05 - Ngay 7: Todo UI CRUD

- Lam cac page:
  - Todo list
  - Todo detail
  - Create todo
  - Edit todo
  - Delete todo
- Goi API that.
- Hien thi loading state co ban.
- Hien thi loi co ban.
- Sau khi create/edit/delete thi redirect hoac refresh list.

Ket qua cuoi ngay:

- CRUD todo hoat dong tu frontend.
- UI chua can qua dep, uu tien chay dung.

### 27/05 - Ngay 8: Calendar, Board Va Polish

- Lam Todo Calendar page.
- Lam Todo Board page.
- Board goi:

```http
PATCH /api/todos/{id}/status
```

- Dong bo `status` va `isCompleted`.
- Don lai Tailwind layout.
- Kiem tra responsive co ban.

Ket qua cuoi ngay:

- Cac tinh nang MVC cu co ban da co ban tuong duong o frontend moi.
- App Web API + JWT + Web Client chay duoc end-to-end.

### 28/05 - Ngay 9: Test, Fix, README

- Test toan bo flow:
  - Register
  - Login
  - Logout
  - Create todo
  - Edit todo
  - Delete todo
  - Detail todo
  - Calendar
  - Board
  - API khong token tra `401`
- Fix bug.
- Viet README:
  - Cach chay backend
  - Cach chay frontend
  - Connection string
  - JWT config
- Commit ban hoan thanh.

Ket qua cuoi ngay:

- Project chay duoc end-to-end.
- Co huong dan chay ro rang.
- MVC cu co the giu tam hoac xoa sau.

## API Contracts

### Auth

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

`RegisterRequest`:

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "Password123"
}
```

`LoginRequest`:

```json
{
  "usernameOrEmail": "testuser",
  "password": "Password123"
}
```

`AuthResponse`:

```json
{
  "token": "jwt-token",
  "expiresAt": "2026-05-28T12:00:00Z",
  "user": {
    "userId": 1,
    "username": "testuser",
    "email": "testuser@example.com"
  }
}
```

### Todos

```http
GET /api/todos
GET /api/todos/{id}
POST /api/todos
PUT /api/todos/{id}
DELETE /api/todos/{id}
PATCH /api/todos/{id}/status
GET /api/todos/calendar
```

`TodoDto`:

```json
{
  "id": 1,
  "title": "Sample Task",
  "description": "Task description",
  "isCompleted": false,
  "category": "Work",
  "priority": "High",
  "status": "Pending",
  "isAllDay": false,
  "reminderMinutes": 15,
  "createdAt": "2026-05-20T09:00:00",
  "startDate": "2026-05-20T10:00:00",
  "dueDate": "2026-05-20T11:00:00"
}
```

Luu y:

- Client khong gui `userId`.
- Backend tu gan `userId` theo JWT claim.

## Checklist Tong

```text
[ ] 20/05 - Backup + tao solution structure
[ ] 21/05 - API ket noi database
[ ] 22/05 - Register/Login service
[ ] 23/05 - JWT hoan chinh
[ ] 24/05 - Todo REST API hoan chinh
[ ] 25/05 - React client + login/register
[ ] 26/05 - Todo CRUD UI
[ ] 27/05 - Calendar + Board
[ ] 28/05 - Test, fix bug, README, commit
```

## Test Plan

### Backend

- Register thanh cong.
- Reject email trung.
- Reject username trung.
- Login thanh cong tra JWT hop le.
- Login sai tra `401`.
- Goi Todo API khong co token tra `401`.
- User chi xem duoc Todo cua minh.
- User khong sua/xoa duoc Todo cua user khac.
- `PATCH /status` cap nhat `status`.
- Khi `status` la `Done`, `isCompleted` phai thanh `true`.

### Frontend

- Register flow hoat dong.
- Login flow hoat dong.
- Logout xoa token.
- Protected routes redirect ve login khi chua co token.
- Todo CRUD goi API that.
- Calendar hien thi dung data.
- Board hien thi dung data.
- Board update status duoc.

## Uu Tien Neu Bi Tre

Neu khong du thoi gian, cat bot theo thu tu:

1. Bo Angular, chi lam React.
2. Calendar lam don gian truoc.
3. Board lam dang cot don gian, chua can drag/drop.
4. Tests tu dong de sau, nhung van test thu cong bang Swagger/Postman.
5. UI polish de cuoi cung.

## Nguyen Tac Lam Viec

- Khong xoa MVC cu ngay tu dau.
- Backend phai xong truoc frontend.
- Khong luu plain text password.
- Khong tin `userId` tu client.
- Moi API can bao ve du lieu theo user dang dang nhap.
- Test bang Swagger/Postman truoc khi noi frontend.
- Moi ngay nen commit it nhat mot lan khi milestone da chay duoc.
