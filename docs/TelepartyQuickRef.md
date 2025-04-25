TelepartyClient Library Documentation
Overview
The TelepartyClient library provides a client-side interface for interacting with a Teleparty WebSocket server. It handles establishing the connection, sending and receiving messages, managing chat room creation and joining, and handling connection lifecycle events.

Installation
(Assuming installation via npm or yarn, add specific instructions if available, e.g., npm install teleparty-websocket-lib)

Usage

import { TelepartyClient, SocketEventHandler, SocketMessage, SocketMessageTypes, MessageList } from 'teleparty-websocket-lib'; // Adjust import path if necessary

// 1. Implement the SocketEventHandler interface
class MyEventHandler implements SocketEventHandler {
    onConnectionReady(): void {
        console.log("WebSocket connection established.");
        // Connection is ready, you can now join or create rooms
    }

    onClose(): void {
        console.log("WebSocket connection closed.");
        // Handle reconnection logic if needed
    }

    onMessage(message: SocketMessage): void {
        console.log("Received message:", message);
        // Handle incoming messages like new chat messages, user join/leave notifications, etc.
        // Example: Check message.type and message.data
        if (message.type === SocketMessageTypes.RECEIVE_MESSAGE) {
            const chatMessage = message.data; // Assuming data structure matches SessionChatMessage
            console.log(`New message from ${chatMessage.nickname}: ${chatMessage.body}`);
        } else if (message.type === SocketMessageTypes.UPDATE_USER_LIST) {
            console.log("User list updated:", message.data.users);
        }
    }
}

// 2. Instantiate the client
const eventHandler = new MyEventHandler();
const client = new TelepartyClient(eventHandler);

// 3. Use the client methods (typically after onConnectionReady)
async function setupChat() {
    try {
        // Option A: Create a new room
        const roomId = await client.createChatRoom("MyNickname", "optional_icon_url");
        console.log("Created room with ID:", roomId);

        // Option B: Join an existing room
        // const existingRoomId = "some-room-id";
        // const messageHistory: MessageList = await client.joinChatRoom("MyNickname", existingRoomId, "optional_icon_url");
        // console.log("Joined room. Message history:", messageHistory.messages);

        // 4. Send messages
        client.sendMessage(SocketMessageTypes.SEND_MESSAGE, { body: "Hello everyone!" });
        client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, { typing: true });

    } catch (error) {
        console.error("Error setting up chat:", error);
    }
}

// Call setupChat() when appropriate, likely after onConnectionReady is triggered.
// Make sure to call teardown when the client is no longer needed.
// client.teardown();


TelepartyClient Class
Constructor
new TelepartyClient(eventHandler: SocketEventHandler)
Creates a new instance of the TelepartyClient.

Parameters:
eventHandler: SocketEventHandler - An object that implements the SocketEventHandler interface to handle WebSocket events.
Methods
async createChatRoom(nickname: string, userIcon?: string): Promise<string>
Initiates the creation of a new chat room on the server. Internally, this sends a CREATE_SESSION message.

Parameters:
nickname: string - The desired display name for the user creating the room.
userIcon?: string (Optional) - A URL pointing to an image to be used as the user's avatar.
Returns: Promise<string> - A promise that resolves with the unique roomId (session ID) for the newly created chat room.

async joinChatRoom(nickname: string, roomId: string, userIcon?: string): Promise<MessageList>
Joins an existing chat room using its ID. Internally, this sends a JOIN_SESSION message.

Parameters:
nickname: string - The desired display name for the user joining the room.
roomId: string - The unique ID of the room to join.
userIcon?: string (Optional) - A URL pointing to an image to be used as the user's avatar.
Returns: Promise<MessageList> - A promise that resolves with a MessageList object containing the history of messages (messages array) for the joined session.
sendMessage(type: SocketMessageTypes, data: any, callback?: CallbackFunction): void
Sends a message payload to the WebSocket server.

Parameters:
type: SocketMessageTypes - The type of message being sent. See the SocketMessageTypes enum for possible values (e.g., SEND_MESSAGE, SET_TYPING_PRESENCE).
data: any - The payload associated with the message type. The expected structure depends on the type.
For SocketMessageTypes.SEND_MESSAGE: { body: string }
For SocketMessageTypes.SET_TYPING_PRESENCE: { typing: boolean }
callback?: CallbackFunction (Optional) - A function to be executed when the server sends a direct response to this specific message. The callback receives (error: any | null, responseData?: any).
Returns: void
teardown(): void
Closes the underlying WebSocket connection gracefully and cleans up any internal resources (like keep-alive timers).

Parameters: None.
Returns: void
SocketEventHandler Interface

This interface must be implemented by the object passed to the TelepartyClient constructor. It defines the methods that the client will call in response to various WebSocket events.

Methods
onConnectionReady(): void
Called when the WebSocket connection to the server has been successfully established and is ready for communication (e.g., creating/joining rooms).

onClose(): void
Called when the WebSocket connection has been closed, either intentionally (via teardown()) or unintentionally (e.g., network error, server disconnect).

onMessage(message: SocketMessage): void
Called whenever a message is received from the WebSocket server that is not a direct response handled by a sendMessage callback. This includes broadcast messages like new chat messages from other users, user join/leave notifications, typing indicators from others, etc.

Parameters:
message: SocketMessage - An object containing the received message details, typically including type (a SocketMessageTypes value) and data (the message payload).
Related Types

SocketMessageTypes: An enum defining the different types of messages that can be sent or received.
SocketMessage: Interface representing the structure of messages received via the onMessage handler.
MessageList: Interface representing the object returned by joinChatRoom, containing an array of SessionChatMessage objects.
SessionChatMessage: Interface representing a single chat message within a session, usually containing details like sender nickname, message body, timestamp, etc. (Exact structure depends on server implementation).
CallbackFunction: Type definition for the optional callback function used with sendMessage: (error: any | null, responseData?: any) => void.

________________________________________________________

Usage
Imports:

import { TelepartyClient, SocketEventHandler, SocketMessageTypes, SessionChatMessage } from 'teleparty-websocket-lib';
Initializing the Client

import { TelepartyClient, SocketEventHandler } from 'teleparty-websocket-lib';

const eventHandler: SocketEventHandler = {
    onConnectionReady: () => { alert("Connection has been established") },
    onClose: () => { alert("Socket has been closed") },
    onMessage: (message) => { alert("Received message: " + message) }
};

const client = new TelepartyClient(eventHandler);
Creating a chat room:

let roomId = await client.createChatRoom(nickname, userIcon);
Joining a chat room:

client.joinChatRoom(nickname, roomId, userIcon);
Sending a chat message:

client.sendMessage(SocketMessageTypes.SEND_MESSAGE, {
    body: 'Hello world'
});
Updating typing presence:

client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
    typing: true
});
Receiving messages:

const eventHandler: SocketEventHandler = {
    ...
    onMessage: (message) => {
        // process message according to type
    }
    ...
};