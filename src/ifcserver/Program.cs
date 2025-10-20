using ifcserver.Data;
using ifcserver.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------
// 1️⃣ Configure services (Dependency Injection)
// ---------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Increase max request body size to 500 MB for large IFC files
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 500_000_000; // 500 MB
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 500_000_000; // 500 MB
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IIfcService, IfcService>();
builder.Services.AddScoped<IPythonIfcService, PythonIfcService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IIfcElementService, IfcElementService>();

var app = builder.Build();

// ---------------------------------------------------
// 2️⃣ Configure Middleware Pipeline
// ---------------------------------------------------

// Common middleware (applies to all environments)
app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();

// ---------------------------------------------------
// 🌱 Development mode configuration
// ---------------------------------------------------
if (app.Environment.IsDevelopment())
{
    Console.WriteLine("🚀 Running in DEVELOPMENT mode");

    // Enable Swagger UI for API testing
    app.UseSwagger();
    app.UseSwaggerUI();

    // Optional: enable developer exception page
    app.UseDeveloperExceptionPage();
}

// ---------------------------------------------------
// 🏭 Production mode configuration
// ---------------------------------------------------
else if (app.Environment.IsProduction())
{
    Console.WriteLine("🏭 Running in PRODUCTION mode");

    // Get the React build path
    var reactAppDist = Path.GetFullPath(
        Path.Combine(app.Environment.ContentRootPath, "..", "webui", "dist")
    );

    if (Directory.Exists(reactAppDist))
    {
        Console.WriteLine($"✅ Serving React build from: {reactAppDist}");

        // Serve static files (JS, CSS, assets)
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(reactAppDist)
        });

        // Fallback to index.html for SPA routes
        app.MapFallbackToFile("index.html", new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(reactAppDist)
        });
    }
    else
    {
        Console.WriteLine($"⚠️ React build not found at: {reactAppDist}");
    }
}

// ---------------------------------------------------
// 3️⃣ Map Controllers (API endpoints)
// ---------------------------------------------------
app.MapControllers();

// ---------------------------------------------------
// 4️⃣ Ensure database exists
// ---------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// ---------------------------------------------------
// 5️⃣ Start the application
// ---------------------------------------------------
app.Run();
