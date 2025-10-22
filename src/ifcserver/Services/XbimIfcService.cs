using System.Diagnostics;
using System.Text.Json;
using ifcserver.Models;
using Xbim.Ifc;
using Xbim.Ifc4.Interfaces;
using Xbim.Common;
using Xbim.Common.Step21;

namespace ifcserver.Services;

/// <summary>
/// Service for IFC processing using XBIM Toolkit (C# implementation).
/// Provides the same functionality as PythonIfcService but using native C# libraries.
/// </summary>
public class XbimIfcService : IXbimIfcService
{
    private readonly ILogger<XbimIfcService> _logger;
    private readonly IProcessingMetricsCollector _metricsCollector;

    public XbimIfcService(
        ILogger<XbimIfcService> logger,
        IProcessingMetricsCollector metricsCollector)
    {
        _logger = logger;
        _metricsCollector = metricsCollector;
    }

    public async Task<IfcMetadata> ParseIfcFileAsync(string ifcFilePath)
    {
        if (!File.Exists(ifcFilePath))
        {
            throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
        }

        _logger.LogInformation($"[XBIM] Parsing IFC file: {ifcFilePath}");

        return await Task.Run(() =>
        {
            using var model = IfcStore.Open(ifcFilePath);

            var project = model.Instances.FirstOrDefault<IIfcProject>();

            var metadata = new IfcMetadata
            {
                ProjectName = project?.Name ?? "Unknown",
                Schema = model.SchemaVersion.ToString(),
                EntityCounts = new Dictionary<string, int>()
            };

            // Count entities by type
            var entityCounts = model.Instances
                .GroupBy(i => i.ExpressType.Name)
                .ToDictionary(g => g.Key, g => g.Count());

            metadata.EntityCounts = entityCounts;

            _logger.LogInformation($"[XBIM] Successfully parsed IFC file. Project: {metadata.ProjectName}, Schema: {metadata.Schema}");

            return metadata;
        });
    }

    public async Task<GltfExportResult> ExportGltfAsync(string ifcFilePath, string outputPath, GltfExportOptions? options = null)
    {
        if (!File.Exists(ifcFilePath))
        {
            throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
        }

        options ??= new GltfExportOptions();

        _logger.LogInformation($"[XBIM] Exporting IFC to glTF: {ifcFilePath} -> {outputPath}");

        return await Task.Run(() =>
        {
            try
            {
                // XBIM doesn't have native glTF export yet, so we'll create a placeholder
                // In a real implementation, you would use XBIM's geometry engine to generate meshes
                // and write them to glTF format

                // For now, return a result indicating the feature is not fully implemented
                return new GltfExportResult
                {
                    Success = false,
                    OutputPath = outputPath,
                    FileSize = 0,
                    ErrorMessage = "XBIM glTF export not yet implemented. Use IfcOpenShell for glTF conversion."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[XBIM] Failed to export glTF: {ifcFilePath}");
                return new GltfExportResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        });
    }

    public async Task<IfcElementProperties> ExtractPropertiesAsync(string ifcFilePath, string elementGuid)
    {
        if (!File.Exists(ifcFilePath))
        {
            throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
        }

        _logger.LogInformation($"[XBIM] Extracting properties for element: {elementGuid} from {ifcFilePath}");

        return await Task.Run(() =>
        {
            using var model = IfcStore.Open(ifcFilePath);

            var element = model.Instances.FirstOrDefault<IIfcRoot>(e => e.GlobalId == elementGuid);

            if (element == null)
            {
                throw new InvalidOperationException($"Element not found: {elementGuid}");
            }

            // Extract property sets
            var propertySets = new Dictionary<string, Dictionary<string, object?>>();
            var quantities = new Dictionary<string, Dictionary<string, object?>>();

            if (element is IIfcObject ifcObject)
            {
                foreach (var rel in ifcObject.IsDefinedBy)
                {
                    if (rel is IIfcRelDefinesByProperties relProps && relProps.RelatingPropertyDefinition is IIfcPropertySet pset)
                    {
                        var props = new Dictionary<string, object>();
                        foreach (var prop in pset.HasProperties)
                        {
                            if (prop is IIfcPropertySingleValue singleValue && singleValue.NominalValue != null)
                            {
                                props[prop.Name] = singleValue.NominalValue.ToString() ?? "";
                            }
                        }
                        if (props.Any())
                        {
                            propertySets[pset.Name] = props;
                        }
                    }
                    else if (rel is IIfcRelDefinesByProperties relQuantity && relQuantity.RelatingPropertyDefinition is IIfcElementQuantity qset)
                    {
                        var quants = new Dictionary<string, object>();
                        foreach (var quantity in qset.Quantities)
                        {
                            if (quantity is IIfcPhysicalSimpleQuantity simpleQty)
                            {
                                // Extract quantity value based on type
                                object? value = quantity switch
                                {
                                    IIfcQuantityLength len => len.LengthValue,
                                    IIfcQuantityArea area => area.AreaValue,
                                    IIfcQuantityVolume vol => vol.VolumeValue,
                                    IIfcQuantityCount count => count.CountValue,
                                    IIfcQuantityWeight weight => weight.WeightValue,
                                    IIfcQuantityTime time => time.TimeValue,
                                    _ => null
                                };

                                if (value != null)
                                {
                                    quants[quantity.Name] = value;
                                }
                            }
                        }
                        if (quants.Any())
                        {
                            quantities[qset.Name] = quants;
                        }
                    }
                }
            }

            // Extract type properties
            var typeProperties = new Dictionary<string, Dictionary<string, object?>>();
            if (element is IIfcObject obj && obj.IsTypedBy != null)
            {
                foreach (var relType in obj.IsTypedBy)
                {
                    var elementType = relType.RelatingType;
                    if (elementType != null)
                    {
                        var typeProps = new Dictionary<string, object?>
                        {
                            ["TypeName"] = elementType.Name ?? "",
                            ["TypeDescription"] = elementType.Description ?? ""
                        };
                        typeProperties["ElementType"] = typeProps;
                    }
                }
            }

            var result = new IfcElementProperties
            {
                GlobalId = elementGuid,
                PropertySets = propertySets,
                Quantities = quantities,
                TypeProperties = typeProperties
            };

            _logger.LogInformation($"[XBIM] Successfully extracted properties for element: {elementGuid}");

            return result;
        });
    }

    public async Task<object> ExtractSpatialTreeAsync(string ifcFilePath, bool flat = false)
    {
        if (!File.Exists(ifcFilePath))
        {
            throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
        }

        _logger.LogInformation($"[XBIM] Extracting spatial tree from: {ifcFilePath} (flat: {flat})");

        return await Task.Run<object>(() =>
        {
            using var model = IfcStore.Open(ifcFilePath);

            if (flat)
            {
                // Return flat list of spatial elements
                var spatialElements = model.Instances
                    .OfType<IIfcSpatialStructureElement>()
                    .Select(e => new
                    {
                        GlobalId = e.GlobalId,
                        Name = e.Name,
                        Type = e.ExpressType.Name
                    })
                    .ToList();

                return new { ElementCount = spatialElements.Count, Elements = spatialElements };
            }
            else
            {
                // Build hierarchical tree
                var project = model.Instances.FirstOrDefault<IIfcProject>();
                if (project == null)
                {
                    throw new InvalidOperationException("No IfcProject found in model");
                }

                var tree = BuildSpatialNode(project);
                return tree;
            }
        });
    }

    public async Task<List<IfcElement>> ExtractAllElementsAsync(string ifcFilePath)
    {
        var (elements, _) = await ExtractAllElementsWithMetricsAsync(ifcFilePath);
        return elements;
    }

    public async Task<(List<IfcElement> elements, XbimMetrics metrics)> ExtractAllElementsWithMetricsAsync(
        string ifcFilePath,
        MetricsSession? session = null)
    {
        if (!File.Exists(ifcFilePath))
        {
            throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
        }

        _logger.LogInformation($"[XBIM] Extracting all elements from: {ifcFilePath} (with metrics)");

        return await Task.Run(() =>
        {
            var metrics = new XbimMetrics();
            var stopwatch = Stopwatch.StartNew();

            // Parse timing
            var parseStart = Stopwatch.StartNew();
            using var model = IfcStore.Open(ifcFilePath);
            parseStart.Stop();
            metrics.Timings.ParseMs = (int)parseStart.ElapsedMilliseconds;

            // Element extraction timing
            var extractStart = Stopwatch.StartNew();
            var elements = new List<IfcElement>();
            var elementTypeCounts = new Dictionary<string, int>();

            foreach (var ifcElement in model.Instances.OfType<IIfcElement>())
            {
                try
                {
                    var globalId = ifcElement.GlobalId;
                    var elementType = ifcElement.ExpressType.Name;

                    // Count by type
                    elementTypeCounts.TryGetValue(elementType, out var count);
                    elementTypeCounts[elementType] = count + 1;

                    // Extract properties
                    var propertySets = new Dictionary<string, object>();
                    var quantities = new Dictionary<string, object>();

                    if (ifcElement is IIfcObject ifcObject)
                    {
                        foreach (var rel in ifcObject.IsDefinedBy)
                        {
                            if (rel is IIfcRelDefinesByProperties relProps && relProps.RelatingPropertyDefinition is IIfcPropertySet pset)
                            {
                                var props = new Dictionary<string, object>();
                                foreach (var prop in pset.HasProperties)
                                {
                                    if (prop is IIfcPropertySingleValue singleValue && singleValue.NominalValue != null)
                                    {
                                        props[prop.Name] = singleValue.NominalValue.ToString() ?? "";
                                    }
                                }
                                if (props.Any())
                                {
                                    propertySets[pset.Name] = props;
                                }
                            }
                            else if (rel is IIfcRelDefinesByProperties relQuantity && relQuantity.RelatingPropertyDefinition is IIfcElementQuantity qset)
                            {
                                var quants = new Dictionary<string, object>();
                                foreach (var quantity in qset.Quantities)
                                {
                                    if (quantity is IIfcPhysicalSimpleQuantity simpleQty)
                                    {
                                        object? value = quantity switch
                                        {
                                            IIfcQuantityLength len => len.LengthValue,
                                            IIfcQuantityArea area => area.AreaValue,
                                            IIfcQuantityVolume vol => vol.VolumeValue,
                                            IIfcQuantityCount qcount => qcount.CountValue,
                                            IIfcQuantityWeight weight => weight.WeightValue,
                                            IIfcQuantityTime time => time.TimeValue,
                                            _ => null
                                        };

                                        if (value != null)
                                        {
                                            quants[quantity.Name] = value;
                                        }
                                    }
                                }
                                if (quants.Any())
                                {
                                    quantities[qset.Name] = quants;
                                }
                            }
                        }
                    }

                    // Build properties structure
                    var properties = new Dictionary<string, object>
                    {
                        ["property_sets"] = propertySets,
                        ["quantities"] = quantities,
                        ["type_properties"] = new Dictionary<string, object>()
                    };

                    var element = new IfcElement
                    {
                        GlobalId = globalId,
                        ElementType = elementType,
                        Name = ifcElement.Name,
                        Description = ifcElement.Description,
                        PropertiesJson = JsonSerializer.Serialize(properties),
                        CreatedAt = DateTime.UtcNow
                    };

                    elements.Add(element);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"[XBIM] Failed to extract element {ifcElement.GlobalId}: {ex.Message}");
                    metrics.Warnings.Add($"Failed to extract element {ifcElement.GlobalId}: {ex.Message}");
                }
            }

            extractStart.Stop();
            metrics.Timings.ElementExtractionMs = (int)extractStart.ElapsedMilliseconds;

            // Calculate statistics
            metrics.Statistics.TotalElements = elements.Count;
            metrics.Statistics.ElementTypeCounts = elementTypeCounts;
            metrics.Statistics.TotalPropertySets = elements.Sum(e =>
            {
                try
                {
                    var props = JsonSerializer.Deserialize<Dictionary<string, object>>(e.PropertiesJson ?? "{}");
                    return props?.ContainsKey("property_sets") == true
                        ? ((JsonElement)props["property_sets"]).EnumerateObject().Count()
                        : 0;
                }
                catch
                {
                    return 0;
                }
            });

            stopwatch.Stop();
            metrics.Timings.TotalMs = (int)stopwatch.ElapsedMilliseconds;
            metrics.EndTime = DateTime.UtcNow;

            // Populate MetricsSession if provided
            if (session != null)
            {
                PopulateMetricsSession(session, metrics);
            }

            _logger.LogInformation($"[XBIM] Extracted {elements.Count} elements in {metrics.Timings.TotalMs}ms");

            return (elements, metrics);
        });
    }

    public async Task<(GltfExportResult result, XbimMetrics metrics)> ExportGltfWithMetricsAsync(
        string ifcFilePath,
        string outputPath,
        GltfExportOptions? options = null)
    {
        var metrics = new XbimMetrics();
        var stopwatch = Stopwatch.StartNew();

        var result = await ExportGltfAsync(ifcFilePath, outputPath, options);

        stopwatch.Stop();
        metrics.Timings.GltfExportMs = (int)stopwatch.ElapsedMilliseconds;
        metrics.Timings.TotalMs = (int)stopwatch.ElapsedMilliseconds;
        metrics.EndTime = DateTime.UtcNow;

        if (result.Success && result.FileSize > 0)
        {
            metrics.Statistics.GltfFileSizeBytes = result.FileSize;
        }

        return (result, metrics);
    }

    public async Task<(SpatialNode tree, XbimMetrics metrics)> ExtractSpatialTreeWithMetricsAsync(string ifcFilePath)
    {
        if (!File.Exists(ifcFilePath))
        {
            throw new FileNotFoundException($"IFC file not found: {ifcFilePath}");
        }

        _logger.LogInformation($"[XBIM] Extracting spatial tree with metrics from: {ifcFilePath}");

        return await Task.Run(() =>
        {
            var metrics = new XbimMetrics();
            var stopwatch = Stopwatch.StartNew();

            using var model = IfcStore.Open(ifcFilePath);

            var project = model.Instances.FirstOrDefault<IIfcProject>();
            if (project == null)
            {
                throw new InvalidOperationException("No IfcProject found in model");
            }

            var tree = BuildSpatialNode(project);

            stopwatch.Stop();
            metrics.Timings.SpatialTreeMs = (int)stopwatch.ElapsedMilliseconds;
            metrics.Timings.TotalMs = (int)stopwatch.ElapsedMilliseconds;
            metrics.EndTime = DateTime.UtcNow;

            // Calculate tree statistics
            (var depth, var nodeCount) = CalculateTreeStats(tree);
            metrics.Statistics.TreeDepth = depth;
            metrics.Statistics.NodeCount = nodeCount;

            _logger.LogInformation($"[XBIM] Extracted spatial tree in {metrics.Timings.TotalMs}ms");

            return (tree, metrics);
        });
    }

    private SpatialNode BuildSpatialNode(IIfcObjectDefinition obj)
    {
        var node = new SpatialNode
        {
            GlobalId = obj.GlobalId,
            Name = obj.Name,
            Description = obj.Description,
            IfcType = obj.ExpressType.Name,
            Children = new List<SpatialNode>()
        };

        // Add contained elements (for spatial structure elements)
        if (obj is IIfcSpatialStructureElement spatialElement)
        {
            foreach (var rel in spatialElement.ContainsElements)
            {
                foreach (var element in rel.RelatedElements)
                {
                    if (element is IIfcElement)
                    {
                        node.Children.Add(new SpatialNode
                        {
                            GlobalId = element.GlobalId,
                            Name = element.Name,
                            IfcType = element.ExpressType.Name
                        });
                    }
                }
            }
        }

        // Recursively add decomposed objects (works for both IIfcProject and IIfcSpatialStructureElement)
        // IIfcProject uses IsDecomposedBy to link to IfcSite
        // IfcSite/Building/Storey also use IsDecomposedBy for hierarchy
        foreach (var rel in obj.IsDecomposedBy)
        {
            foreach (var relatedObject in rel.RelatedObjects)
            {
                // Include both spatial elements AND projects in the tree
                if (relatedObject is IIfcSpatialStructureElement || relatedObject is IIfcProject)
                {
                    node.Children.Add(BuildSpatialNode(relatedObject));
                }
            }
        }

        return node;
    }

    private string GetSpatialType(IIfcObjectDefinition obj)
    {
        return obj switch
        {
            IIfcProject => "project",
            IIfcSite => "site",
            IIfcBuilding => "building",
            IIfcBuildingStorey => "storey",
            IIfcSpace => "space",
            _ => "element"
        };
    }

    private (int depth, int nodeCount) CalculateTreeStats(SpatialNode node, int currentDepth = 0)
    {
        var maxDepth = currentDepth;
        var totalNodes = 1;

        if (node.Children != null)
        {
            foreach (var child in node.Children)
            {
                var (childDepth, childNodes) = CalculateTreeStats(child, currentDepth + 1);
                maxDepth = Math.Max(maxDepth, childDepth);
                totalNodes += childNodes;
            }
        }

        return (maxDepth, totalNodes);
    }

    private void PopulateMetricsSession(MetricsSession session, XbimMetrics xbimMetrics)
    {
        // Populate element counts
        if (xbimMetrics.Statistics.ElementTypeCounts != null)
        {
            session.ElementCounts.Clear();
            foreach (var kvp in xbimMetrics.Statistics.ElementTypeCounts)
            {
                session.ElementCounts[kvp.Key] = kvp.Value;
            }
        }

        // Populate statistics
        session.TotalPropertySets = xbimMetrics.Statistics.TotalPropertySets ?? 0;
        session.TotalProperties = xbimMetrics.Statistics.TotalProperties ?? 0;
        session.TotalQuantities = xbimMetrics.Statistics.TotalQuantities ?? 0;
        session.SpatialTreeDepth = xbimMetrics.Statistics.TreeDepth;
        session.SpatialTreeNodeCount = xbimMetrics.Statistics.NodeCount;
        session.GltfFileSizeBytes = xbimMetrics.Statistics.GltfFileSizeBytes;

        // Populate warnings
        session.WarningCount = xbimMetrics.Warnings.Count;
    }
}
