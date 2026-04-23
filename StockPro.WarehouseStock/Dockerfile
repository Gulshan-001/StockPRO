FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5002

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["StockPro.WarehouseStock.csproj", "./"]
RUN dotnet restore "StockPro.WarehouseStock.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "StockPro.WarehouseStock.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "StockPro.WarehouseStock.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "StockPro.WarehouseStock.dll"]
