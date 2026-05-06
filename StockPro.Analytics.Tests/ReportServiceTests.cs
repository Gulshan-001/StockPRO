using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using StockPro.Analytics.Data;
using StockPro.Analytics.DTOs;
using StockPro.Analytics.Services;
using System.Net;
using System.Text.Json;

namespace StockPro.Analytics.Tests;

public class ReportServiceTests
{
    private readonly DbContextOptions<AnalyticsDbContext> _dbOptions;
    private readonly Mock<IHttpClientFactory> _httpFactory;
    private readonly Mock<IConfiguration> _config;
    private readonly Mock<ILogger<ReportServiceImpl>> _logger;

    public ReportServiceTests()
    {
        _dbOptions = new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var myConfiguration = new Dictionary<string, string>
        {
            {"ServiceUrls:WarehouseStock", "http://warehouse"},
            {"ServiceUrls:ProductItem", "http://product"},
            {"ServiceUrls:StockMovement", "http://movement"},
            {"JwtSettings:SecretKey", "TestSecretKeyTestSecretKeyTestSecretKey@2026"},
            {"JwtSettings:Issuer", "TestIssuer"},
            {"JwtSettings:Audience", "TestAudience"}
        };

        _configObject = new ConfigurationBuilder()
            .AddInMemoryCollection(myConfiguration!)
            .Build();

        _httpFactory = new Mock<IHttpClientFactory>();
        _logger = new Mock<ILogger<ReportServiceImpl>>();
    }

    private readonly IConfiguration _configObject;

    [Fact]
    public async Task TakeSnapshotAsync_ShouldSaveCorrectValues()
    {
        // Arrange
        var warehouseId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        
        var stockData = new List<StockLevelDto> 
        { 
            new StockLevelDto { WarehouseId = warehouseId, ProductId = productId, Quantity = 100 } 
        };
        var productData = new List<ProductDto> 
        { 
            new ProductDto { ProductId = productId, CostPrice = 50.0m, Name = "Test Product", SKU = "TP-001" } 
        };

        SetupMockHttpClient(new Dictionary<string, object>
        {
            { "http://warehouse/api/stock", stockData },
            { "http://product/api/products", productData }
        });

        using var db = new AnalyticsDbContext(_dbOptions);
        var service = new ReportServiceImpl(db, _httpFactory.Object, _configObject, _logger.Object);

        // Act
        var result = await service.TakeSnapshotAsync();

        // Assert
        Assert.Equal(1, result.RecordsWritten);
        var snapshot = await db.Snapshots.FirstOrDefaultAsync();
        Assert.NotNull(snapshot);
        Assert.Equal(5000.0m, snapshot.StockValue); // 100 * 50
        Assert.Equal(100, snapshot.Quantity);
    }

    [Fact]
    public async Task GetDeadStockAsync_ShouldIdentifyProductsWithNoMovement()
    {
        // Arrange
        var prod1 = Guid.NewGuid(); // Moving
        var prod2 = Guid.NewGuid(); // Dead
        
        var movements = new List<MovementDto>
        {
            new MovementDto { ProductId = prod1, MovementDate = DateTime.UtcNow.AddDays(-10), Quantity = 5, MovementType = "STOCK_OUT" }
        };
        var products = new List<ProductDto>
        {
            new ProductDto { ProductId = prod1, Name = "Active", SKU = "A1", CostPrice = 10, IsActive = true },
            new ProductDto { ProductId = prod2, Name = "Dead", SKU = "D1", CostPrice = 20, IsActive = true }
        };
        var stock = new List<StockLevelDto>
        {
            new StockLevelDto { ProductId = prod1, Quantity = 50 },
            new StockLevelDto { ProductId = prod2, Quantity = 100 }
        };

        SetupMockHttpClient(new Dictionary<string, object>
        {
            { "http://movement/api/movements", movements },
            { "http://product/api/products", products },
            { "http://warehouse/api/stock", stock }
        });

        using var db = new AnalyticsDbContext(_dbOptions);
        var service = new ReportServiceImpl(db, _httpFactory.Object, _configObject, _logger.Object);

        // Act
        var result = await service.GetDeadStockAsync(daysSinceMovement: 30);

        // Assert
        Assert.Single(result);
        Assert.Equal("Dead", result[0].ProductName);
        Assert.Equal(prod2, result[0].ProductId);
    }

    private void SetupMockHttpClient(Dictionary<string, object> urlToDataMap)
    {
        var handlerMock = new Mock<HttpMessageHandler>();

        foreach (var entry in urlToDataMap)
        {
            var json = JsonSerializer.Serialize(entry.Value);
            handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => req.RequestUri.ToString() == entry.Key),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(json)
                });
        }

        var httpClient = new HttpClient(handlerMock.Object);
        _httpFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);
    }
}
