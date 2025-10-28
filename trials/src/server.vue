<template>
    <div class="app">
        <h2>Chat</h2>

        <!-- Username setup -->
        <div v-if="!usernameSet" class="username-box">
            <input v-model="username" placeholder="Enter your username" @keyup.enter="setUsername"/>
            <button @click="setUsername">Join Chat</button>
        </div>

        <!-- chat ui -->
         <div v-else class="chat-box">
            <ul class="messages">
                <li v-for="(msg, index) in messages" :key="index" :class="{'own': msg.user === username, 'system': msg.type === 'system'}">
                    <span v-if="msg.type === 'chat'"> <b>{{ msg.user }}:</b> {{ msg.msg }} </span>
                    <span v-else>{{ msg.msg }}</span>
                </li>
            </ul>

            <div class="input-row">
                <input v-model="newMsg" placeholder="Type a message" @keyup.enter="sendMessage"/>
                <button @click="sendMessage">Send</button>
            </div>
         </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { socket } from "./socket";
const username = ref("");
const usernameSet = ref(false);
const newMsg = ref("");
const messages = ref([]);

const setUsername = () => {
    if(username.value.trim()) {
        usernameSet.value = true;
        socket.emit("setUsername", username.value);
    }
}

const sendMessage = () => {
    if (newMsg.value.trim()) {
        socket.emit("chat message", newMsg.value = "")
    }
}

onMounted(() => {
    socket.on("chat message", (data) => {
        messages.value.push({ type: "chat", ...data });
    })

    socket.on("system", (msg) => {
        messages.value.push({ type: "system", msg });
    })
})
</script>

<style scoped>
.app {
    max-width: 600px;
    margin: 30px auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 0 10px #ccc;
    padding: 20px;
    font-family: Arial, sans-serif;
}

.username-box, .input-row {
    display: flex;
    gap: 10px;
}

input {
    flex: 1;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
}

button {
    padding: 10px 15px;
    border: none;
    background: #2196f3;
    color: white;
    border-radius: 5px;
    cursor: pointer;
}

ul.messages {
    list-style: none;
    padding: 0;
    height: 300px;
    overflow-y: auto;
    margin-bottom: 15px;
}

li {
    padding: 6px 10px;
    margin-bottom: 6px;
    border-radius: 5px;
    background: #f1f0f0;
}

li.own {
    background: #dcf8c6;
    text-align: right;
}

li.system {
    text-align: center;
    font-style: italic;
    color: #888;
}
</style>