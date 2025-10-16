import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { Menu, Search, Globe, Bell, Sun, Moon, ChevronDown, ChevronRight, LogOut, Settings, User } from 'lucide-react';

interface MenuItem {
  label: string;
  expandable?: boolean;
  key?: string;
  active?: boolean;
  disabled?: boolean;
}

interface MenuSection {
  category: string;
  items: MenuItem[];
}

interface SubItem {
  label: string;
  badge?: string;
}

interface ExpandedItems {
  [key: string]: boolean;
}

interface Vertex {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
}

export default function Dashboard(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [expandedItems, setExpandedItems] = useState<ExpandedItems>({ components: false });
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let rotation: number = 0;
    let mouseDown: boolean = false;
    let lastMouseX: number = 0;

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement> | any): void => {
      mouseDown = true;
      lastMouseX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement> | any): void => {
      if (mouseDown) {
        const deltaX = e.clientX - lastMouseX;
        rotation += deltaX * 0.01;
        lastMouseX = e.clientX;
      }
    };

    const onMouseUp = (): void => {
      mouseDown = false;
    };

    canvas.addEventListener('mousedown', onMouseDown as any);
    canvas.addEventListener('mousemove', onMouseMove as any);
    canvas.addEventListener('mouseup', onMouseUp);

    // Simple 3D cube rendering
    const drawCube = (): void => {
      ctx.fillStyle = '#2a3f5f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cube vertices
      const vertices: Vertex[] = [
        { x: -1, y: -1, z: -1 },
        { x: 1, y: -1, z: -1 },
        { x: 1, y: 1, z: -1 },
        { x: -1, y: 1, z: -1 },
        { x: -1, y: -1, z: 1 },
        { x: 1, y: -1, z: 1 },
        { x: 1, y: 1, z: 1 },
        { x: -1, y: 1, z: 1 },
      ];

      // Rotate vertices
      const rotated = vertices.map(({ x, y, z }) => {
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);
        const newX = x * cosR - z * sinR;
        const newZ = x * sinR + z * cosR;
        return { x: newX, y, z: newZ };
      });

      // Project to 2D
      const projected: ProjectedPoint[] = rotated.map(({ x, y, z }) => {
        const scale = 200 / (5 + z);
        return {
          x: canvas.width / 2 + x * scale,
          y: canvas.height / 2 + y * scale,
          z,
        };
      });

      // Draw cube edges
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;

      const edges: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];

      edges.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(projected[start].x, projected[start].y);
        ctx.lineTo(projected[end].x, projected[end].y);
        ctx.stroke();
      });

      // Draw vertices
      ctx.fillStyle = '#60a5fa';
      projected.forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      rotation += 0.01;
      requestAnimationFrame(drawCube);
    };

    drawCube();

    const handleResize = (): void => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown as any);
      canvas.removeEventListener('mousemove', onMouseMove as any);
      canvas.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

 useEffect(() => {
  let viewer: Cesium.Viewer | null = null;

  if (window.Cesium) {
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOTJmNjIyYS03OGU4LTQzNTItODhjZi01NjAwYzViOGM0NjciLCJpZCI6MTc0OTA0LCJpYXQiOjE2OTg2Njg3MTZ9.sDadw-ajbDiChUDURxxG2Wdllpe7dbDf5B7I3Rlg9Q4";
    
    viewer = new Cesium.Viewer('cesium-container', {
      // Use the direct constructor instead of the helper function
      terrainProvider: new Cesium.CesiumTerrainProvider({
        url: Cesium.IonResource.fromAssetId(1),
      }),
      // Other options to clean up the UI
      animation: false,
      timeline: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      fullscreenButton: false,
    });

    viewer.scene.globe.enableLighting = true;
  }

  // Cleanup
  return () => {
    if (viewer && !viewer.isDestroyed()) {
      viewer.destroy();
    }
  };
}, []);

  const toggleExpandItem = (item: string): void => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const menuItems: MenuSection[] = [
    {
      category: 'USER INTERFACE',
      items: [
        { label: 'Components', expandable: true, key: 'components' },
        { label: 'Forms', expandable: false },
        { label: 'Tables', expandable: false }
      ]
    },
    {
      category: 'MAPS',
      items: [
        { label: 'Maps', expandable: false, active: true },
        { label: 'Charts', expandable: false, disabled: true }
      ]
    },
    {
      category: 'TABLES AND FORMS',
      items: [
        { label: 'Basic Tables', expandable: false },
        { label: 'Data Tables', expandable: false }
      ]
    }
  ];

  const subItems: Record<string, SubItem[]> = {
    components: [
      { label: 'Buttons' },
      { label: 'Cards' },
      { label: 'Modals', badge: 'New' }
    ]
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 flex flex-col border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            {sidebarOpen && <h1 className="text-2xl font-bold text-blue-600">CORK</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-200 rounded">
              {sidebarOpen ? <ChevronDown size={20} className="rotate-90" /> : <Menu size={20} />}
            </button>
          </div>
          {sidebarOpen && (
            <div className="text-sm">
              <p className="font-semibold">Shaun Park</p>
              <p className="text-gray-500 text-xs">Project Leader</p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3">
          {menuItems.map((section, idx) => (
            <div key={idx} className="mb-6">
              {sidebarOpen && <p className="text-xs font-bold text-gray-500 mb-2 px-2">{section.category}</p>}
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx}>
                  <button
                    onClick={() => item.expandable && item.key && toggleExpandItem(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active
                        ? 'bg-blue-600 text-white'
                        : item.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : `hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {sidebarOpen && item.label}
                    </span>
                    {sidebarOpen && item.expandable && (
                      <ChevronRight size={16} className={`transition-transform ${item.key && expandedItems[item.key] ? 'rotate-90' : ''}`} />
                    )}
                  </button>
                  
                  {/* Sub-items */}
                  {sidebarOpen && item.expandable && item.key && expandedItems[item.key] && (
                    <div className="ml-4 mt-1">
                      {subItems[item.key]?.map((subItem, subIdx) => (
                        <button
                          key={subIdx}
                          className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                          {subItem.label}
                          {subItem.badge && <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{subItem.badge}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6 py-4 flex items-center justify-between shadow-sm`}>
          {/* Search Bar */}
          <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 rounded-lg flex-1 max-w-md`}>
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className={`bg-transparent border-none outline-none flex-1 text-sm ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
            />
            <span className="text-xs text-gray-500">Ctrl + /</span>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Language Selector */}
            <button className="p-2 hover:bg-gray-200 rounded-lg">🌐</button>

            {/* Notifications */}
            <button className="p-2 hover:bg-gray-200 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold"
              >
                SP
              </button>
              {showProfileMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} z-50 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-b">
                    <User size={16} /> Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-b">
                    <Settings size={16} /> Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 overflow-auto p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {/* Breadcrumbs */}
          <div className="mb-6 text-sm text-gray-600">
            Basic <span className="mx-2">/</span> Panes <span className="mx-2">/</span> Interactive Choropleth
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Geospatial Globe Panel */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden flex flex-col h-96`}>
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Geospatial Globe</h2>
              </div>
              <div 
                id="cesium-container"
                className="flex-1 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <Globe size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Cesium.js Globe Loading...</p>
                  <p className="text-xs opacity-75 mt-1">Add Cesium API key to enable</p>
                </div>
              </div>
              <div className="px-6 py-3 border-t flex">
                <button className="text-blue-600 font-medium text-sm hover:underline">Code &gt;</button>
              </div>
            </div>

            {/* BIM Model Viewer Panel */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden flex flex-col h-96`}>
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">BIM Model Viewer</h2>
              </div>
              <canvas
                ref={canvasRef}
                className="flex-1 cursor-grab active:cursor-grabbing"
              ></canvas>
              <div className="px-6 py-3 border-t flex">
                <button className="text-blue-600 font-medium text-sm hover:underline">Code &gt;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}