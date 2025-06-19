
interface YouTubeAPIState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

class YouTubeAPIService {
  private state: YouTubeAPIState = {
    isLoaded: false,
    isLoading: false,
    error: null,
    retryCount: 0
  };

  private maxRetries = 3;
  private retryDelay = 1000;
  private loadPromise: Promise<void> | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      this.state.isLoaded = true;
    }
  }

  async loadAPI(): Promise<void> {
    if (this.state.isLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.performLoad();
    return this.loadPromise;
  }

  private async performLoad(): Promise<void> {
    if (this.state.isLoading) return;

    this.state.isLoading = true;
    this.state.error = null;

    return new Promise<void>((resolve, reject) => {
      const attemptLoad = () => {
        try {
          // Check if script already exists
          if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            document.head.appendChild(script);
          }

          // Setup callback
          window.onYouTubeIframeAPIReady = () => {
            this.state.isLoaded = true;
            this.state.isLoading = false;
            this.state.error = null;
            this.notifyListeners();
            resolve();
          };

          // Fallback check in case callback doesn't fire
          const checkInterval = setInterval(() => {
            if (window.YT && window.YT.Player) {
              clearInterval(checkInterval);
              if (!this.state.isLoaded) {
                this.state.isLoaded = true;
                this.state.isLoading = false;
                this.state.error = null;
                this.notifyListeners();
                resolve();
              }
            }
          }, 100);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!this.state.isLoaded) {
              this.handleLoadError(new Error('YouTube API load timeout'), resolve, reject);
            }
          }, 10000);

        } catch (error) {
          this.handleLoadError(error as Error, resolve, reject);
        }
      };

      attemptLoad();
    });
  }

  private handleLoadError(error: Error, resolve: () => void, reject: (error: Error) => void) {
    this.state.isLoading = false;
    this.state.error = error.message;
    this.state.retryCount++;

    console.warn(`YouTube API load attempt ${this.state.retryCount} failed:`, error);

    if (this.state.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.state.isLoading = false;
        this.loadPromise = null;
        this.performLoad().then(resolve).catch(reject);
      }, this.retryDelay * this.state.retryCount);
    } else {
      this.notifyListeners();
      reject(new Error(`Failed to load YouTube API after ${this.maxRetries} attempts: ${error.message}`));
    }
  }

  getState(): YouTubeAPIState {
    return { ...this.state };
  }

  onStateChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.warn('YouTube API listener error:', error);
      }
    });
  }

  reset() {
    this.state = {
      isLoaded: false,
      isLoading: false,
      error: null,
      retryCount: 0
    };
    this.loadPromise = null;
  }
}

export const youTubeAPIService = new YouTubeAPIService();
