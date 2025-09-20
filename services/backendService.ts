import type { GameAction, PartyMember, GameState } from '../types';

/**
 * A centralized handler for fetch errors to provide more helpful diagnostics.
 * @param error The caught error.
 * @param context A string describing the action that failed (e.g., 'fetch screen').
 * @returns An Error object with a more informative message.
 */
function handleFetchError(error: unknown, context: string): Error {
    console.error(`Failed to ${context}:`, error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return new Error(
            'Network connection failed. The app could not reach your Python server.\n\n' +
            'Please check the following common issues:\n\n' +
            '1. **Is the Server Running?**\n' +
            '   - Ensure the Python server script is active and not showing any errors in its terminal.\n\n' +
            '2. **Is the Server URL Correct?**\n' +
            '   - Go to Settings and verify the "Pyboy Server URL".\n' +
            '   - **IMPORTANT:** If the server is on a different machine (even on a local network or via Tailscale), you **CANNOT** use `localhost`. You must use the server\'s network IP address (e.g., `http://192.168.1.10:5000` or a Tailscale IP like `http://100.x.x.x:5000`).\n\n' +
            '3. **Is the Server Listening on the Network?**\n' +
            '   - Your Python Flask server must be started to listen on all network interfaces. The command should be `app.run(host=\'0.0.0.0\', port=5000)`.\n\n' +
            '4. **Is a Firewall Blocking the Port?**\n' +
            '   - Firewalls on the server machine (like Windows Defender Firewall) can block the connection. Try creating a rule to allow incoming traffic on the port your server is using (e.g., 5000).\n\n' +
            '5. **Is CORS Configured?**\n' +
            '   - Ensure your Python server has the `flask-cors` library correctly configured with `CORS(app)`.'
        );
    }
    if (error instanceof Error) {
        return error;
    }
    return new Error(`An unknown error occurred while trying to ${context}.`);
}

/**
 * Fetches the current game screen as a blob.
 * @returns {Promise<Blob>} A promise that resolves to the image blob.
 */
export async function getScreen(baseUrl: string): Promise<Blob> {
  try {
    const response = await fetch(`${baseUrl}/screen`);
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
    return response.blob();
  } catch (error) {
    throw handleFetchError(error, 'fetch screen');
  }
}

/**
 * Sends a game action to the backend.
 * @param {GameAction} action The action to perform.
 */
export async function sendAction(baseUrl: string, action: GameAction): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
  } catch (error) {
    // Don't rethrow, but log the more informative error.
    console.error(handleFetchError(error, 'send action'));
  }
}

/**
 * Fetches the current Pokémon party data from the backend.
 * @returns {Promise<PartyMember[]>} A promise that resolves to an array of PartyMember objects.
 */
export async function getParty(baseUrl: string): Promise<PartyMember[]> {
  try {
    const response = await fetch(`${baseUrl}/party`);
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(handleFetchError(error, 'fetch party data'));
    // Return an empty array so the app doesn't crash on a failed fetch.
    return [];
  }
}

/**
 * Fetches the complete current game state from the backend.
 * @returns {Promise<GameState>} A promise that resolves to the game state object.
 */
export async function getGameState(baseUrl: string): Promise<GameState> {
    try {
      const response = await fetch(`${baseUrl}/state`);
      if (!response.ok) {
        throw new Error(`Backend error getting game state: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error(handleFetchError(error, 'fetch game state'));
      // Return a default/empty state to prevent crashing.
      return {
        achievements: [],
        inventory: [],
        map: { name: 'Unknown Area', coords: [0, 0], pointsOfInterest: [], explorationGrid: [] },
        party: [],
        stats: { runtime: '00:00:00', steps: 0, money: 0 },
        dialogue: '',
      };
    }
}

/**
 * Uploads a ROM file to the backend to be loaded.
 * @param {File} romFile The ROM file to upload.
 */
export async function loadRom(baseUrl: string, romFile: File): Promise<void> {
    const formData = new FormData();
    formData.append('rom', romFile);

    try {
        const response = await fetch(`${baseUrl}/load_rom`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'Failed to load ROM on backend.');
        }
        // Success, no body expected
    } catch (error) {
        throw handleFetchError(error, 'upload ROM');
    }
}

/**
 * Tells the backend to save the current emulator state.
 */
export async function saveState(baseUrl: string): Promise<void> {
    try {
        const response = await fetch(`${baseUrl}/save_state`, { method: 'POST' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'Failed to save state on backend.');
        }
    } catch (error) {
        throw handleFetchError(error, 'save state');
    }
}

/**
 * Tells the backend to load the last saved emulator state.
 */
export async function loadState(baseUrl: string): Promise<void> {
    try {
        const response = await fetch(`${baseUrl}/load_state`, { method: 'POST' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'Failed to load state on backend.');
        }
    } catch (error) {
        throw handleFetchError(error, 'load state');
    }
}