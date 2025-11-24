<template>
  <div class="min-h-screen flex flex-col items-center bg-linear-to-br from-sky-50 to-blue-100 py-10 px-4 font-sans rounded-b-2xl">
    <p class="lg:text-2xl md:text-xl text-md mb-3 font-bold italic flex text-center ">Have Fun time with Friends and Folks</p>
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
      <h2 class="text-2xl font-semibold text-center bg-linear-to-br from-cyan-700  to-cyan-200 text-white py-4">💬 Pop-Time Chat</h2>

      <!-- Username setup -->
      <div v-if="!usernameSet" class="flex flex-col items-center justify-center p-6 space-y-4">
        <input
          v-model="username"
          placeholder="Enter your username"
          @keyup.enter="setUsername"
          class="w-full p-3 border rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
        />
        <button
          @click="setUsername"
          class="w-full bg-linear-to-br from-cyan-600 to bg-yellow-100 font-semibold text-gray-800 py-2 rounded-md hover:bg-cyan-200 transition"
        >
          Join Chat
        </button>
      </div>

      <!-- Chat UI -->
      <div v-else class="flex flex-col h-[500px]">
        <ul
          class="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 space-y-3 scroll-smooth"
          ref="messageList"
        >
          <li
            v-for="(msg, index) in messages"
            :key="index"
            :class="{
              'text-center italic text-gray-500': msg.type === 'system',
              'flex justify-end': msg.user === username && msg.type === 'chat',
              'flex justify-start': msg.user !== username && msg.type === 'chat'
            }"
          >
            <template v-if="msg.type === 'chat'">
              <div
                :class="[
                  'max-w-[75%] rounded-2xl px-4 py-2 relative shadow-sm',
                  msg.user === username
                    ? 'bg-gray-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                ]"
              >
                <p class="text-sm">
                  <span class="font-semibold">{{ msg.user }}</span>
                  <span class="block wrap-break-word pb-3">{{ msg.msg }}</span>
                </p>
                <span
                  class="absolute bottom-1 right-2 text-[0.65rem] opacity-80"
                >
                  {{ msg.timestamp }}
                </span>
              </div>
            </template>

            <template v-else>
              <span class="text-gray-500 text-sm">{{ msg.msg }}</span>
            </template>
          </li>
        </ul>

        <!-- Typing indicator -->
        <div
          v-if="typingUser && typingUser !== username"
          class="px-4 py-1 text-sm text-cyan-600 italic"
        >
          {{ typingUser }} is typing...
        </div>

        <!-- Input area -->
        <div class="flex items-center p-3 bg-gray-100 border-t border-gray-200">
          <input
            v-model="newMsg"
            placeholder="Type a message..."
            @input="handleTyping"
            @keyup.enter="sendMessage"
            class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
          />
          <button
            @click="sendMessage"
            class="ml-3 bg-linear-to-br from-gray-500 bg-cyan-600 text-white hover:text-gray-300 px-4 py-2 rounded-lg transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { io } from "socket.io-client";

const socket = io("https://websockets-rxrp.onrender.com");

const username = ref("");
const usernameSet = ref(false);
const newMsg = ref("");
const messages = ref([]);
const typingUser = ref("");
const messageList = ref(null);

const setUsername = () => {
  if (username.value.trim()) {
    usernameSet.value = true;
    socket.emit("setUsername", username.value);
  }
};

const sendMessage = () => {
  if (newMsg.value.trim()) {
    socket.emit("chat message", newMsg.value);
    newMsg.value = "";
    socket.emit("typing", false);
  }
};

const handleTyping = () => {
  socket.emit("typing", newMsg.value.trim().length > 0);
};

watch(messages, async () => {
  await nextTick();
  const el = messageList.value;
  if (el) el.scrollTop = el.scrollHeight;
});

onMounted(() => {
  socket.on("chat message", (data) => {
    messages.value.push({ type: "chat", ...data });
  });

  socket.on("system", (msg) => {
    messages.value.push({ type: "system", msg });
  });

  socket.on("typing", (data) => {
    typingUser.value = data.isTyping ? data.user : "";
  });
});
</script>

<style scoped>
/* Optional custom scrollbar for modern look */
ul::-webkit-scrollbar {
  width: 6px;
}
ul::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
</style>
