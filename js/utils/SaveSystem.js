// Local storage management for game save data
class SaveSystem {
    constructor() {
        this.storageKey = 'taekwondo-robot-builder-save';
        this.version = '1.0.0';
        
        // Test localStorage availability
        this.isAvailable = this.testLocalStorage();
        
        if (!this.isAvailable) {
            console.warn('localStorage not available, using memory storage');
            this.memoryStorage = {};
        }
    }

    testLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    save(gameData) {
        try {
            const saveData = {
                version: this.version,
                timestamp: new Date().toISOString(),
                data: gameData
            };

            const serializedData = JSON.stringify(saveData);

            if (this.isAvailable) {
                localStorage.setItem(this.storageKey, serializedData);
                console.log('Game saved to localStorage');
            } else {
                this.memoryStorage[this.storageKey] = serializedData;
                console.log('Game saved to memory storage');
            }

            return true;
        } catch (error) {
            console.error('Failed to save game data:', error);
            return false;
        }
    }

    load() {
        try {
            let serializedData;

            if (this.isAvailable) {
                serializedData = localStorage.getItem(this.storageKey);
            } else {
                serializedData = this.memoryStorage[this.storageKey];
            }

            if (!serializedData) {
                console.log('No save data found');
                return null;
            }

            const saveData = JSON.parse(serializedData);

            // Check version compatibility
            if (saveData.version !== this.version) {
                console.warn(`Save data version mismatch: ${saveData.version} vs ${this.version}`);
                // Could implement migration logic here
            }

            console.log('Game loaded from storage');
            return saveData.data;

        } catch (error) {
            console.error('Failed to load game data:', error);
            return null;
        }
    }

    delete() {
        try {
            if (this.isAvailable) {
                localStorage.removeItem(this.storageKey);
            } else {
                delete this.memoryStorage[this.storageKey];
            }
            console.log('Save data deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save data:', error);
            return false;
        }
    }

    exists() {
        try {
            if (this.isAvailable) {
                return localStorage.getItem(this.storageKey) !== null;
            } else {
                return this.storageKey in this.memoryStorage;
            }
        } catch (error) {
            console.error('Failed to check save data existence:', error);
            return false;
        }
    }

    getSaveInfo() {
        try {
            let serializedData;

            if (this.isAvailable) {
                serializedData = localStorage.getItem(this.storageKey);
            } else {
                serializedData = this.memoryStorage[this.storageKey];
            }

            if (!serializedData) return null;

            const saveData = JSON.parse(serializedData);
            
            return {
                version: saveData.version,
                timestamp: saveData.timestamp,
                level: saveData.data.currentLevel,
                score: saveData.data.score,
                partsCollected: this.countRobotParts(saveData.data.robotParts)
            };

        } catch (error) {
            console.error('Failed to get save info:', error);
            return null;
        }
    }

    countRobotParts(robotParts) {
        let total = 0;
        for (const partType in robotParts) {
            total += robotParts[partType].length;
        }
        return total;
    }

    // Auto-save functionality
    enableAutoSave(gameInstance, interval = 30000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            if (gameInstance && gameInstance.gameData) {
                this.save(gameInstance.gameData);
                console.log('Auto-save completed');
            }
        }, interval);

        console.log(`Auto-save enabled with ${interval}ms interval`);
    }

    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('Auto-save disabled');
        }
    }

    // Export/Import functionality for advanced users
    exportSave() {
        try {
            let serializedData;

            if (this.isAvailable) {
                serializedData = localStorage.getItem(this.storageKey);
            } else {
                serializedData = this.memoryStorage[this.storageKey];
            }

            if (!serializedData) {
                throw new Error('No save data to export');
            }

            // Create downloadable blob
            const blob = new Blob([serializedData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `taekwondo-robot-builder-save-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('Save data exported');
            return true;

        } catch (error) {
            console.error('Failed to export save data:', error);
            return false;
        }
    }

    importSave(fileInput) {
        return new Promise((resolve, reject) => {
            const file = fileInput.files[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    
                    // Validate save data structure
                    if (!saveData.version || !saveData.data) {
                        throw new Error('Invalid save file format');
                    }

                    // Save imported data
                    if (this.isAvailable) {
                        localStorage.setItem(this.storageKey, e.target.result);
                    } else {
                        this.memoryStorage[this.storageKey] = e.target.result;
                    }

                    console.log('Save data imported successfully');
                    resolve(saveData.data);

                } catch (error) {
                    console.error('Failed to import save data:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    // Clear all game-related storage (for debugging)
    clearAllData() {
        try {
            if (this.isAvailable) {
                // Remove all keys that start with our game prefix
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('taekwondo-robot-builder')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } else {
                this.memoryStorage = {};
            }
            
            console.log('All game data cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear all data:', error);
            return false;
        }
    }

    // Get storage usage info
    getStorageInfo() {
        if (!this.isAvailable) {
            return {
                available: false,
                used: Object.keys(this.memoryStorage).length,
                total: 'Memory only'
            };
        }

        try {
            let used = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length + key.length;
                }
            }

            return {
                available: true,
                used: Math.round(used / 1024) + ' KB',
                total: '5-10 MB (browser dependent)'
            };
        } catch (error) {
            return {
                available: true,
                used: 'Unknown',
                total: 'Unknown',
                error: error.message
            };
        }
    }
}
