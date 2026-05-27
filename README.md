# SimpleToDoApp

This project consists of an Angular frontend and a .NET backend. 
The application is designed to have its frontend hosted on GitHub Pages and backend hosted on Render.

## Project Structure

- `SimpleToDoApp/clients/angular-client/`: The Angular frontend application.
- `SimpleToDoApp/backend/`: The backend API (to be deployed on Render).

## Frontend Environment Configuration

The frontend uses Angular's environment files to connect to the backend.

1. **Local Development**:
   During local development, the frontend uses `src/environments/environment.ts`. By default, it is configured to point to your local backend API.

2. **Production / GitHub Actions**:
   When the code is pushed to the `production` branch, GitHub Actions will automatically build the frontend. 
   The action is configured to replace the API URL dynamically using GitHub Secrets.
   
   To set up the production backend URL:
   - Go to your repository settings on GitHub.
   - Navigate to **Secrets and variables** > **Actions**.
   - Create a new **Repository secret** named `API_URL`.
   - Set the value to your Render backend URL (e.g., `https://your-backend-app.onrender.com/api`).
   
   If the secret is not set, the build will fall back to a placeholder URL defined in the GitHub Actions workflow.

## Deployment

### Frontend (GitHub Pages)

The frontend is automatically deployed to GitHub Pages via GitHub Actions.
1. Push to the `production` branch.
2. The `deploy-frontend.yml` workflow will trigger.
3. Ensure that in the repository settings, under **Pages**, the source is set to **GitHub Actions**.

### Backend (Render)

The backend is an ASP.NET Core API. Khi deploy lên Render, bạn sẽ cần cấu hình **Environment Variables** (Biến môi trường) để thay thế các giá trị trong `appsettings.json`.

> [!WARNING]
> **Lưu ý quan trọng về Database:** Hiện tại dự án đang dùng **SQL Server** (`LocalDbCS`). Render **không hỗ trợ** hosting SQL Server (Render chỉ có PostgreSQL). Do đó bạn có 2 lựa chọn:
> 1. Host SQL Server ở một dịch vụ khác (như Azure SQL, AWS) và cấu hình chuỗi kết nối vào Render.
> 2. Đổi thư viện Entity Framework sang PostgreSQL (`Npgsql.EntityFrameworkCore.PostgreSQL`) nếu muốn dùng chung database của Render.

#### Các biến môi trường cần cấu hình trên Render:
Trên Dashboard của Render, bạn cần tạo các biến môi trường (Environment Variables) sau với cú pháp dấu gạch dưới kép `__` thay cho cấu trúc JSON:

- **Database:**
  - `ConnectionStrings__LocalDbCS` = `[Chuỗi kết nối SQL Server thực tế của bạn]`
- **JWT:**
  - `Jwt__Key` = `[Một chuỗi bí mật dài cho Production]`
  - `Jwt__Issuer` = `SimpleToDoAppApi`
  - `Jwt__Audience` = `SimpleToDoAppClient`
- **Email:**
  - `EmailSettings__Password` = `[App Password thực tế của Gmail]`

#### Docker:
Mình đã tạo sẵn file `Dockerfile` trong thư mục `SimpleToDoApp/backend/`. Bạn có thể sử dụng tính năng **Deploy từ Docker** của Render, chỉ định thư mục gốc là `SimpleToDoApp/backend`.

#### CORS (Cross-Origin Resource Sharing):
API hiện tại đã cấu hình `AllowAnyOrigin()`, `AllowAnyMethod()`, `AllowAnyHeader()` trong `CorsExtensions.cs`. Vì vậy, frontend từ GitHub Pages (`https://thanhnamle.github.io`) có thể gọi API một cách bình thường mà không bị lỗi CORS chặn lại.
