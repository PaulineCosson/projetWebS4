<template>
  <div>
    <h2>Dog Center News</h2>
    <div
      :style="{
        backgroundImage: `url(${newsData[currentIndex].pictureUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '20px',
        color: 'grey',
      }"
    >
      <h3>{{ newsData[currentIndex].title }}</h3>
      <p>{{ newsData[currentIndex].content }}</p>
    </div>
    <div>
      <button 
        @click="selectPrevious" 
        :disabled="currentIndex === 0"
      >
        Previous
      </button>
      <button 
        @click="selectNext" 
        :disabled="currentIndex === newsData.length - 1"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import newsData from '@/newsData.js'

const currentIndex = ref(0)

const selectPrevious = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
  }
}

const selectNext = () => {
  if (currentIndex.value < newsData.length - 1) {
    currentIndex.value += 1
  }
}
</script>