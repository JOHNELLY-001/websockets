<template>
  <div class="min-h-screen flex flex-col items-center bg-linear-to-br from-sky-50 to-blue-100 py-10 px-4 font-sans rounded-b-2xl">

    <p class="lg:text-2xl md:text-xl text-md mb-3 font-bold italic flex text-center">
      Have Fun time with Friends and Folks
    </p>

    <!-- Chat Container -->
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden relative">
      
      <!-- Online Users Button (only show after username is set) -->
      <button
        v-if="usernameSet"
        @click="showOnline = true"
        class="absolute top-3 right-3 text-xs bg-emerald-500 text-white px-3 py-1 rounded-full shadow hover:bg-cyan-700"
      >
        👥 Who's Online
      </button>

      <h2 class="text-2xl font-semibold text-center bg-linear-to-br from-cyan-700 to-cyan-200 text-white py-4">
        💬 Pop-Time Chat
      </h2>

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
      <div v-else class="flex flex-col h-[500px] relative">
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

  <!-- Online Users Popup (small box, centered) -->
  <div
    v-if="showOnline"
    class="online-users-overlay fixed inset-0 bg-opacity-30 flex justify-center items-center z-50"
  >
    <div class="bg-white w-80 rounded-lg shadow-lg p-4">
      <h3 class="text-lg font-semibold mb-3 text-center">👥 Online Users</h3>

      <!-- When no user online -->
      <p
        v-if="Object.keys(onlineUsers).length === 0"
        class="text-center text-gray-500 py-4"
      >
        No users online right now
      </p>

      <!-- Online list -->
      <ul
        v-else
        class="space-y-2 max-h-60 overflow-y-auto"
      >
        <li
          v-for="(name, id) in onlineUsers"
          :key="id"
          class="p-2 rounded-md bg-gray-100 border"
        >
          {{ name }}
        </li>
      </ul>

      <button
        @click="showOnline = false"
        class="mt-4 w-full bg-cyan-600 text-white py-2 rounded-md hover:bg-cyan-700"
      >
        Close
      </button>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { io } from "socket.io-client";

const props = defineProps({
  showOnline: Boolean
});
const emit = defineEmits(["closeOnline"]);

const socket = io("http://websockets-rxrp.onrender.com");

const username = ref("");
const usernameSet = ref(false);
const newMsg = ref("");
const messages = ref([]);
const typingUser = ref("");
const messageList = ref(null);

const onlineUsers = ref({});
const showOnline = ref(false);

// Username
const setUsername = () => {
  if (username.value.trim()) {
    usernameSet.value = true;
    socket.emit("setUsername", username.value);
  }
};

// Send Message
const sendMessage = () => {
  if (newMsg.value.trim()) {
    socket.emit("chat message", newMsg.value);
    newMsg.value = "";
    socket.emit("typing", false);
  }
};

// Typing
const handleTyping = () => {
  socket.emit("typing", newMsg.value.trim().length > 0);
};

// Auto scroll
watch(messages, async () => {
  await nextTick();
  const el = messageList.value;
  if (el) el.scrollTop = el.scrollHeight;
});

// Socket listeners
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

  socket.on("onlineUsers", (list) => {
    onlineUsers.value = list;
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

.online-users-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(4px);
  background: rgba(0,0,0,0.3);
  z-index: 999;
}

</style>
