FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5006

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["StockPro.Analytics.csproj", "./"]
RUN dotnet restore "StockPro.Analytics.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "StockPro.Analytics.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "StockPro.Analytics.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "StockPro.Analytics.dll"]
