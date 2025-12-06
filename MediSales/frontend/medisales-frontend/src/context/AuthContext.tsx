import { useCallback, useMemo, useState, useEffect, type ReactNode } from 'react';
import type { AuthenticatedUser } from '../types/User';
import {
	AUTH_TOKEN_KEY,
	AUTH_USER_KEY,
	AuthContext,
	type AuthContextValue,
} from './authContext';
import signalRService from '../services/signalRService';
import { authService } from '../services/authService';

// Helper function to parse stored user from sessionStorage (per-tab isolation)
const parseStoredUser = (): AuthenticatedUser | null => {
	const raw = sessionStorage.getItem(AUTH_USER_KEY);
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as AuthenticatedUser;
	} catch (error) {
		console.warn('Unable to parse stored user payload', error);
		sessionStorage.removeItem(AUTH_USER_KEY);
		return null;
	}
};

type AuthProviderProps = {
	children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
	// Use sessionStorage for per-tab session isolation (Admin and Staff can run in separate tabs)
	const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(AUTH_TOKEN_KEY));
	const [user, setUser] = useState<AuthenticatedUser | null>(parseStoredUser);

	// Reconnect SignalR if user is already logged in (page refresh)
	useEffect(() => {
		const reconnectSignalR = async () => {
			if (user && !signalRService.isConnected) {
				try {
					await signalRService.startChatConnection(user.userId);
					await signalRService.startNotificationConnection();
					console.log('✅ SignalR reconnected after page refresh');
				} catch (error) {
					console.error('❌ Failed to reconnect SignalR:', error);
				}
			}
		};

		reconnectSignalR();
	}, [user]);

	const login = useCallback(async (newToken: string, authUser: AuthenticatedUser) => {
		setToken(newToken);
		setUser(authUser);
		// Use sessionStorage for per-tab isolation (allows Admin + Staff in separate tabs)
		sessionStorage.setItem(AUTH_TOKEN_KEY, newToken);
		sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));

		// Connect to SignalR hubs after successful login
		try {
			await signalRService.startChatConnection(authUser.userId);
			await signalRService.startNotificationConnection();
			console.log('✅ SignalR connections established');
		} catch (error) {
			console.error('❌ Failed to establish SignalR connections:', error);
		}
	}, []);

	const logout = useCallback(async () => {
		// Call backend logout endpoint if user is logged in
		if (user?.userId) {
			try {
				await authService.logout(user.userId);
			} catch (error) {
				console.error('❌ Backend logout failed:', error);
				// Continue with frontend logout even if backend fails
			}
		}

		// Disconnect from SignalR hubs before logout
		try {
			await signalRService.stopConnections();
			console.log('✅ SignalR connections closed');
		} catch (error) {
			console.error('❌ Error closing SignalR connections:', error);
		}

		setToken(null);
		setUser(null);
		// Clear sessionStorage for this tab only
		sessionStorage.removeItem(AUTH_TOKEN_KEY);
		sessionStorage.removeItem(AUTH_USER_KEY);
	}, [user]);

	const value = useMemo<AuthContextValue>(
		() => ({
			token,
			user,
			// Since JWT is not implemented yet and backend returns null token,
			// we only check if user exists for authentication
			isAuthenticated: Boolean(user),
			login,
			logout,
		}),
		[token, user, login, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
