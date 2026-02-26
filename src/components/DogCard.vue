<template>
  <div id="dog-card">
    <img id="dog-picture" v-bind:src="props.pictureUrl" alt="Dog" />
    <div id="dog-description">
      <h3>{{ props.name }}</h3>
      <p v-if="props.age !== undefined" className="dog-description-line">
        Age: {{ props.age }} years
      </p>
      <p className="dog-description-line">Breed: {{ props.breed }}</p>
      <button @click="playDogSound">Listen</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  name: String,
  breed: String,
  pictureUrl: String,
  soundUrl: String,
  age: { type: Number, required: false }
});

const audio = new Audio(props.soundUrl)

const playDogSound = () => {
  audio.currentTime = 0
  audio.play()
}
</script>

<style scoped>
#dog-card {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  margin: 10px;
}

#dog-picture {
  width: 100%;
  height: 105px;
  object-fit: cover;
}

#dog-description {
  padding: 10px;
  color: #000000;
}

#dog-description h3 {
  font-size: 18px;
  margin: 0;
}

.dog-description-line {
  color: #353535;
  font-size: 12px;
  margin: 5px 0;
}
</style>