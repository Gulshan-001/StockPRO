FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5001

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["StockPro.ProductItem.csproj", "./"]
RUN dotnet restore "StockPro.ProductItem.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "StockPro.ProductItem.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "StockPro.ProductItem.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "StockPro.ProductItem.dll"]
