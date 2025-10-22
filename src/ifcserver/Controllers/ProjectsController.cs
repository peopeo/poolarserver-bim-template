using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ifcserver.Data;
using ifcserver.Models;
using ifcserver.DTOs;

namespace ifcserver.Controllers;

/// <summary>
/// API endpoints for managing BIM projects
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(AppDbContext context, ILogger<ProjectsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all projects with summary information
    /// </summary>
    /// <returns>List of projects</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProjectSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProjectSummaryResponse>>> GetProjects()
    {
        _logger.LogInformation("Fetching all projects");

        var projects = await _context.Projects
            .Include(p => p.Revisions)
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new ProjectSummaryResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                RevisionCount = p.Revisions.Count,
                LatestVersionIdentifier = p.Revisions
                    .OrderByDescending(r => r.SequenceNumber)
                    .Select(r => r.VersionIdentifier)
                    .FirstOrDefault(),
                ActiveVersionIdentifier = p.Revisions
                    .Where(r => r.IsActive)
                    .Select(r => r.VersionIdentifier)
                    .FirstOrDefault()
            })
            .ToListAsync();

        _logger.LogInformation("Found {Count} projects", projects.Count);
        return Ok(projects);
    }

    /// <summary>
    /// Get a single project by ID with all revisions
    /// </summary>
    /// <param name="id">Project ID</param>
    /// <returns>Project details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ProjectDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectDetailResponse>> GetProject(int id)
    {
        _logger.LogInformation("Fetching project {ProjectId}", id);

        var project = await _context.Projects
            .Include(p => p.Revisions)
                .ThenInclude(r => r.Elements)
            .Where(p => p.Id == id)
            .Select(p => new ProjectDetailResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                Revisions = p.Revisions
                    .OrderByDescending(r => r.SequenceNumber)
                    .Select(r => new RevisionSummaryResponse
                    {
                        Id = r.Id,
                        VersionIdentifier = r.VersionIdentifier,
                        SequenceNumber = r.SequenceNumber,
                        Comment = r.Comment,
                        UploadedAt = r.UploadedAt,
                        IsActive = r.IsActive,
                        IfcFileName = r.IfcFileName,
                        ProcessingStatus = r.ProcessingStatus,
                        ProcessingError = r.ProcessingError,
                        ElementCount = r.Elements.Count
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (project == null)
        {
            _logger.LogWarning("Project {ProjectId} not found", id);
            return NotFound(new { message = $"Project with ID {id} not found" });
        }

        _logger.LogInformation("Retrieved project {ProjectId} with {RevisionCount} revisions",
            id, project.Revisions.Count);
        return Ok(project);
    }

    /// <summary>
    /// Create a new project
    /// </summary>
    /// <param name="request">Project creation data</param>
    /// <returns>Created project</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ProjectDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectDetailResponse>> CreateProject([FromBody] CreateProjectRequest request)
    {
        _logger.LogInformation("Creating new project: {Name}", request.Name);

        var project = new Project
        {
            Name = request.Name,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created project {ProjectId}: {Name}", project.Id, project.Name);

        var response = new ProjectDetailResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Revisions = new List<RevisionSummaryResponse>()
        };

        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, response);
    }

    /// <summary>
    /// Update an existing project
    /// </summary>
    /// <param name="id">Project ID</param>
    /// <param name="request">Updated project data</param>
    /// <returns>Updated project</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ProjectDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectDetailResponse>> UpdateProject(int id, [FromBody] UpdateProjectRequest request)
    {
        _logger.LogInformation("Updating project {ProjectId}", id);

        var project = await _context.Projects
            .Include(p => p.Revisions)
                .ThenInclude(r => r.Elements)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            _logger.LogWarning("Project {ProjectId} not found", id);
            return NotFound(new { message = $"Project with ID {id} not found" });
        }

        project.Name = request.Name;
        project.Description = request.Description;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated project {ProjectId}", id);

        var response = new ProjectDetailResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Revisions = project.Revisions
                .OrderByDescending(r => r.SequenceNumber)
                .Select(r => new RevisionSummaryResponse
                {
                    Id = r.Id,
                    VersionIdentifier = r.VersionIdentifier,
                    SequenceNumber = r.SequenceNumber,
                    Comment = r.Comment,
                    UploadedAt = r.UploadedAt,
                    IsActive = r.IsActive,
                    IfcFileName = r.IfcFileName,
                    ProcessingStatus = r.ProcessingStatus,
                    ProcessingError = r.ProcessingError,
                    ElementCount = r.Elements.Count
                })
                .ToList()
        };

        return Ok(response);
    }

    /// <summary>
    /// Delete a project and all its revisions
    /// </summary>
    /// <param name="id">Project ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProject(int id)
    {
        _logger.LogInformation("Deleting project {ProjectId}", id);

        var project = await _context.Projects
            .Include(p => p.Revisions)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            _logger.LogWarning("Project {ProjectId} not found", id);
            return NotFound(new { message = $"Project with ID {id} not found" });
        }

        var revisionCount = project.Revisions.Count;

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted project {ProjectId} with {RevisionCount} revisions", id, revisionCount);

        return NoContent();
    }

    /// <summary>
    /// Get the active revision for a project
    /// </summary>
    /// <param name="id">Project ID</param>
    /// <returns>Active revision details</returns>
    [HttpGet("{id}/active-revision")]
    [ProducesResponseType(typeof(RevisionSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RevisionSummaryResponse>> GetActiveRevision(int id)
    {
        _logger.LogInformation("Fetching active revision for project {ProjectId}", id);

        var activeRevision = await _context.Revisions
            .Include(r => r.Elements)
            .Where(r => r.ProjectId == id && r.IsActive)
            .Select(r => new RevisionSummaryResponse
            {
                Id = r.Id,
                VersionIdentifier = r.VersionIdentifier,
                SequenceNumber = r.SequenceNumber,
                Comment = r.Comment,
                UploadedAt = r.UploadedAt,
                IsActive = r.IsActive,
                IfcFileName = r.IfcFileName,
                ProcessingStatus = r.ProcessingStatus,
                ProcessingError = r.ProcessingError,
                ElementCount = r.Elements.Count
            })
            .FirstOrDefaultAsync();

        if (activeRevision == null)
        {
            _logger.LogWarning("No active revision found for project {ProjectId}", id);
            return NotFound(new { message = $"No active revision found for project {id}" });
        }

        return Ok(activeRevision);
    }
}
