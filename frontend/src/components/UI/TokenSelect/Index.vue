
<template>
  <div
    v-if="modelValue"
    class="custom-select"
    :class="[`custom-select_mode-${mode}`]"
    @click.stop
  >
    <div class="custom-select__view">
      <div class="custom-select__view-selected">
        <img :src="getToken(modelValue) ? getToken(modelValue).token.img : null" alt="">
        <span>{{getToken(modelValue) ? getToken(modelValue).token.symbol : null}}</span>
      </div>
      <div class="custom-select__view-search">
        <input class="input" type="text" v-model.trim="searchToken" ref="tokenInputElement" :placeholder="'search'">
      </div>
      <span class="custom-select__view-arrow">
        <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.3536 0.853553C11.5488 0.658291 11.5488 0.341709 11.3536 0.146447C11.1583 -0.0488155 10.8417 -0.0488155 10.6464 0.146447L11.3536 0.853553ZM6 5.5L5.64645 5.85355C5.74022 5.94732 5.86739 6 6 6C6.13261 6 6.25979 5.94732 6.35355 5.85355L6 5.5ZM1.35355 0.146447C1.15829 -0.0488155 0.841709 -0.0488155 0.646447 0.146447C0.451184 0.341709 0.451184 0.658291 0.646447 0.853553L1.35355 0.146447ZM10.6464 0.146447L5.64645 5.14645L6.35355 5.85355L11.3536 0.853553L10.6464 0.146447ZM6.35355 5.14645L1.35355 0.146447L0.646447 0.853553L5.64645 5.85355L6.35355 5.14645Z"></path></svg>
      </span>
      <div class="custom-select__view-choose" @click="openOptions"></div>
    </div>
    <div class="custom-select__options">
      <template v-if="viewTokensList && viewTokensList.length">
        <div
          class="option"
          v-for="tokenValue in viewTokensList"
          :key="tokenValue.tokenId"
          @click="selectToken(tokenValue.token)"
        >
          <img :src="getToken(tokenValue.token.tokenId) ? getToken(tokenValue.token.tokenId).token.img : null" alt="">
          <span>{{getToken(tokenValue.token.tokenId) ? getToken(tokenValue.token.tokenId).token.symbol : null}}</span>
        </div>
      </template>
      <div v-else class="custom-select__options-notice">Contract not loaded</div>
    </div>
  </div>
</template>

<script>
import {getSettings} from "@/crypto/helpers/Ethereum";
import {ConnectionStore} from '@/crypto/helpers'
// todo export from index
import tokensPolygon from './jsons/tokensPolygon.json'
import tokensRinkeby from './jsons/tokensRinkeby.json'
import tokensRopsten from './jsons/tokensRopsten.json'
import tokensMainnet from './jsons/tokensMainnet.json'

const list = {
  tokensPolygon,
  tokensRinkeby,
  tokensRopsten,
  tokensMainnet
}

export default {
  name: "token-select",
  props: {
    modelValue: {
      type: String,
      default: '',
    }
  },

  data() {
    return {
      mode: 'choose',
      searchToken: '',
      tokenInputElement: null,
    }
  },

  mounted() {
    document.addEventListener('click', this.closeOptions)
  },

  computed: {
    getToken() {
      return (itemId) => this.tokensOption.find((tokenData) => tokenData.token.tokenId === itemId)
    },

    tokensOption() {
      const tokensList = getSettings(ConnectionStore.getNetwork().name)
      let activeTokens = []

      if (tokensList && tokensList.tokens) {
        activeTokens = list[tokensList.tokens]
      }
      console.log(activeTokens, 'activeTokens')
      
      return activeTokens.map((token, index) => ({ token: token, id: index }))
    },

    viewTokensList() {
      const query = this.searchToken.toLowerCase()

      if(query.length > 2){
        return this.tokensOption.filter(token => {
          return token.token.tokenId.toLowerCase().token.includes(query)
        })
      }

      return this.tokensOption
    }
  },

  methods: {
    openOptions() {
      console.log('openOptions')
      this.mode = 'choose-open'
      this.$nextTick(() => this.$refs.tokenInputElement.focus())
    },
    closeOptions() {
      this.mode = 'choose'
    },
    selectToken(token) {
      this.$emit('change', token)
      this.searchToken = ''
      this.closeOptions()
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-select{
  display: flex;
  align-items: center;
  position: relative;
  background: rgba(255, 255, 255, 0.6);
  color: #015a9c;
  z-index: 2;
  height: 56px;
  min-width: 150px;
  max-width: 150px;
  padding: 10px 15px;
  margin-right: 10px;
  border-radius: 12px;
  

  &__view{
    &-arrow{
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      cursor: pointer;

      svg{
        display: block;
        width: 100%;

        path{
          fill: #000
        }
      }
    }
    &-choose{
      display: none;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .input{
      width: 100%;
      border-radius: 8px;
      height: 32px;
      font-size: 20px;
      line-height: 20px;
      background: transparent;
      color: #000;
      border: 0;
    }
  }

  &__options{
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    max-height: 200px;
    overflow: auto;
    color: #fff;
    background: #2d0949;
    border-radius: 0 0 4px 4px;

    .option {
      position: relative;
      padding: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: flex-start;

      &:last-child {
        &::after {
          display: none;
        }
      }

      img {
        margin-right: 15px;
        max-width: 30px;
      }

      div{
        color: #fff;
        font-weight: 500;
        font-size: 14px;
        line-height: 17px;


        &:first-child{
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &:nth-child(2){
          padding-left: 20px;
        }
      }

      &:hover{
        background: rgba(92, 233, 188, 0.8);
      }
    }

    &-notice,
    &-add{
      padding: 0 15px;
      color: #fff;
      opacity: .5;
      font-weight: 500;
      font-size: 14px;
      line-height: 17px;
    }

    &-add{
      color: #fff;
      opacity: 1;
      cursor: pointer;

      span{
        color: #fff
      }

      div{
        color: var(--marked-second-color);
        padding-top: 3px;
      }

    }
  }


  &_mode-choose &__view-choose{
    display: block;
  }
  &_mode-choose &__view-selected{
    display: flex;
    align-items: center;
  }
  &_mode-choose &__view-search{
    display: none;
  }
  &_mode-choose &__options{
    display: none;
  }


  &_mode-choose-open &__view-choose{
    display: none;
  }
  &_mode-choose-open &__view-selected{
    display: none;
  }
  &_mode-choose-open &__view-search{
    display: block;
  }
  &_mode-choose-open &__options{
    display: flex;
    flex-direction: column;
  }

  &__our{
    color: #fff;
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    margin: 10px 0 15px 0;

    & > span{
      color: #000;
      cursor: pointer;
    }

    div{
      padding-top: 3px;

      span{
        color: #000;
        cursor: pointer;
      }
    }
  }

  //&__our + &__our{
  //  margin-bottom: 25px;
  //}

  &__our + .toggle{
    margin-top: 25px
  }
}


.custom-select__view-selected {
  img {
    margin-right: 10px;
    max-width: 30px;
  }

  span {
    font-weight: 700;
    font-size: 16px;
  }
}
</style>