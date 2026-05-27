FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["SimpleToDoApp.Api/SimpleToDoApp.Api.csproj", "SimpleToDoApp.Api/"]
COPY ["SimpleToDoApp.Application/SimpleToDoApp.Application.csproj", "SimpleToDoApp.Application/"]
COPY ["SimpleToDoApp.Domain/SimpleToDoApp.Domain.csproj", "SimpleToDoApp.Domain/"]
COPY ["SimpleToDoApp.Infrastructure/SimpleToDoApp.Infrastructure.csproj", "SimpleToDoApp.Infrastructure/"]

RUN dotnet restore "SimpleToDoApp.Api/SimpleToDoApp.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/SimpleToDoApp.Api"
RUN dotnet build "SimpleToDoApp.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SimpleToDoApp.Api.csproj" -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Tùy chọn để app lắng nghe trên cổng do Render chỉ định qua biến môi trường PORT (mặc định 8080)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "SimpleToDoApp.Api.dll"]
