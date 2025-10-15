using ifcserver.Data;
using ifcserver.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------
// 1. Add services to the dependency injection container
// ---------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IIfcService, IfcService>();

var app = builder.Build();

// ---------------------------------------------------
// 2. Configure the HTTP request pipeline (Middleware)
// ---------------------------------------------------

// It's good practice to redirect HTTP to HTTPS in all environments.
app.UseHttpsRedirection();

// ✅ Always enable Swagger and Swagger UI, regardless of the environment.
app.UseSwagger();
app.UseSwaggerUI();

// Get the physical path to the React app's 'dist' folder.
var reactAppDist = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "webui", "dist"));

if (Directory.Exists(reactAppDist))
{
    // Configure the app to serve static files (CSS, JS, images) from the React app.
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(reactAppDist)
    });
}
else
{
    Console.WriteLine($"⚠️ React build not found at {reactAppDist}");
}

// These are required for API controllers to work.
app.UseRouting();
app.UseAuthorization();

// Map your API controllers. Requests starting with "/api/..." will be handled here.
app.MapControllers();

if (Directory.Exists(reactAppDist))
{
    // As a fallback for any request that didn't match an API controller,
    // a static file, or Swagger, serve the 'index.html' file.
    app.MapFallbackToFile("index.html", new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(reactAppDist)
    });
}

// ---------------------------------------------------
// 3. Application startup tasks
// ---------------------------------------------------

// Ensure the database is created on startup.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// Run the application.
app.Run();