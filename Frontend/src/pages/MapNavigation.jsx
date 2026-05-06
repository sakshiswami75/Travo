import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';

export default function MapNavigation() {
  return (
    <div className="bg-surface text-on-surface h-screen w-full overflow-hidden flex flex-col relative">
      <TopAppBar />

      {/* Map Canvas Area */}
      <main className="flex-1 relative w-full h-full map-bg" data-location="San Francisco">
        {/* Mobile Search Bar Overlay */}
        <div className="absolute top-8 left-margin-mobile right-margin-mobile md:top-24 md:max-w-md md:left-gutter z-30">
          <div className="bg-surface rounded-[16px] shadow-lg border border-outline-variant/20 flex items-center p-2 h-[56px]">
            <span className="material-symbols-outlined text-on-surface-variant ml-2">search</span>
            <input type="text" placeholder="Where to?" className="flex-1 bg-transparent border-none focus:ring-0 text-body-lg font-body-lg text-on-surface placeholder:text-outline mx-2" />
            <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-primary">mic</span>
            </button>
          </div>
        </div>

        {/* Floating Map Controls */}
        <div className="absolute top-32 right-margin-mobile flex flex-col gap-stack-md z-20">
          <button className="w-12 h-12 bg-surface rounded-full shadow-lg border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">layers</span>
          </button>
          <button className="w-12 h-12 bg-surface rounded-full shadow-lg border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">my_location</span>
          </button>
        </div>

        {/* Pothole / Hazard Markers */}
        <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 animate-pulse">
          <div className="bg-primary-container text-on-primary rounded-full p-2 shadow-lg mb-1">
            <span className="material-symbols-outlined text-sm">warning</span>
          </div>
          <div className="w-2 h-2 bg-primary-container rounded-full shadow-sm"></div>
        </div>
        <div className="absolute top-1/2 right-1/3 transform translate-x-1/4 -translate-y-1/4 flex flex-col items-center z-10">
          <div className="bg-tertiary-container text-on-tertiary rounded-full p-2 shadow-lg mb-1">
            <span className="material-symbols-outlined text-sm">report_problem</span>
          </div>
          <div className="w-2 h-2 bg-tertiary-container rounded-full shadow-sm"></div>
        </div>

        {/* User Location Marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-ping absolute"></div>
          <div className="w-6 h-6 bg-primary rounded-full border-4 border-surface shadow-lg relative z-10"></div>
        </div>

        {/* Route Selection Card */}
        <div className="absolute bottom-[90px] left-margin-mobile right-margin-mobile md:bottom-8 md:max-w-md md:left-gutter z-30">
          <div className="bg-surface rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-outline-variant/30 overflow-hidden">
            <div className="p-gutter">
              <div className="flex justify-between items-start mb-stack-sm">
                <h2 className="text-h3 font-h3 text-on-surface">Route Options</h2>
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-caption font-caption">Safest</span>
              </div>
              <div className="flex flex-col gap-stack-sm">
                <div className="border border-primary ring-1 ring-primary rounded-lg p-3 bg-primary-container/5 flex justify-between items-center cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    <div>
                      <div className="text-body-md font-body-md font-bold text-on-surface">Safest Path</div>
                      <div className="text-caption font-caption text-on-surface-variant">0 Hazards • Smooth roads</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-body-md font-body-md font-bold text-primary">18 min</div>
                    <div className="text-caption font-caption text-on-surface-variant">4.2 mi</div>
                  </div>
                </div>
                <div className="border border-outline-variant/20 rounded-lg p-3 hover:bg-surface-container-low flex justify-between items-center cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">speed</span>
                    <div>
                      <div className="text-body-md font-body-md font-bold text-on-surface">Fastest Path</div>
                      <div className="text-caption font-caption text-tertiary-container">2 Potholes reported</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-body-md font-body-md font-bold text-on-surface">14 min</div>
                    <div className="text-caption font-caption text-on-surface-variant">3.8 mi</div>
                  </div>
                </div>
              </div>
              <button className="w-full bg-primary-container text-on-primary h-[56px] rounded-lg text-label-bold font-label-bold mt-stack-md shadow-md hover:bg-primary-fixed-variant transition-colors">
                Start Navigation
              </button>
            </div>
          </div>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
