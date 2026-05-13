FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5004

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["StockPro.Purchase.csproj", "./"]
RUN dotnet restore "StockPro.Purchase.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "StockPro.Purchase.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "StockPro.Purchase.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "StockPro.Purchase.dll"]
