FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5005

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["StockPro.Alert.csproj", "./"]
RUN dotnet restore "StockPro.Alert.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "StockPro.Alert.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "StockPro.Alert.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "StockPro.Alert.dll"]
