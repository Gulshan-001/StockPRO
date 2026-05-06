using Microsoft.EntityFrameworkCore;
using StockPro.Analytics.Data;
using StockPro.Analytics.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using StockPro.Analytics.DTOs;
using StockPro.Analytics.Models;

namespace StockPro.Analytics.BackgroundJobs;

/// <summary>
/// IHostedService that runs the daily inventory snapshot job at midnight UTC.
/// Case Study Section 2.8 + 4.8: "Daily inventory snapshot written by IHostedService cron job."
/// Non-functional requirement: "Daily inventory snapshot at midnight via IHostedService."
/// </summary>
public class SnapshotBackgroundService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<SnapshotBackgroundService> _logger;
    private readonly IConfiguration _config;

    private static readonly JsonSerializerOptions _json =
        new() { PropertyNameCaseInsensitive = true };

    public SnapshotBackgroundService(
        IServiceProvider services,
        ILogger<SnapshotBackgroundService> logger,
        IConfiguration config)
    {
        _services = services;
        _logger = logger;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[SnapshotJob] Daily snapshot background service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Calculate delay until next midnight UTC
                var now = DateTime.UtcNow;
                var nextMidnight = now.Date.AddDays(1); // Tomorrow 00:00:00 UTC
                var delay = nextMidnight - now;

                _logger.LogInformation("[SnapshotJob] Next snapshot in {Hours}h {Minutes}m (at {NextRun:yyyy-MM-dd HH:mm} UTC)",
                    (int)delay.TotalHours, delay.Minutes, nextMidnight);

                await Task.Delay(delay, stoppingToken);

                if (stoppingToken.IsCancellationRequested) break;

                await RunSnapshotAsync();
            }
            catch (TaskCanceledException)
            {
                // Graceful shutdown
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SnapshotJob] Snapshot cycle error. Retrying in 1 hour.");
                // On error, wait 1 hour before retrying rather than crashing
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        _logger.LogInformation("[SnapshotJob] Daily snapshot service stopped.");
    }

    private async Task RunSnapshotAsync()
    {
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        _logger.LogInformation("[SnapshotJob] Running daily snapshot for {Date}", date);

        using var scope = _services.CreateScope();
        var reportService = scope.ServiceProvider.GetRequiredService<IReportService>();

        try
        {
            var result = await reportService.TakeSnapshotAsync(date);
            _logger.LogInformation("[SnapshotJob] Snapshot complete: {Count} records written for {Date}",
                result.RecordsWritten, date);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SnapshotJob] Snapshot failed for {Date}. Will retry tomorrow.", date);
        }
    }
}
