/** Pinned downloads. The build refuses a file whose SHA-256 is not the one recorded here. */

export const SOURCE_HAN_ZIP_URL = 'https://github.com/adobe-fonts/source-han-sans/releases/download/2.005R/18_SourceHanSansKR.zip'
/** SHA-256 of the zip itself, not of a member. */
export const SOURCE_HAN_ZIP_SHA256 = 'ada0398122ebfebcae9efc1c6bb1dc5512c03b8f54035a8f527cd82a3c0441ac'

export const SOURCE_HAN_VF_URL = 'https://github.com/adobe-fonts/source-han-sans/raw/release/Variable/TTF/Subset/SourceHanSansKR-VF.ttf'
export const SOURCE_HAN_VF_SHA256 = '35af3f67cf8c9c6cacd138a6a251b34317af1c601dfef4bc0ef4b64f7aa7a705'

/** SHA-256 of each static member `SubsetOTF/KR/SourceHanSansKR-<weight>.otf`. */
export const SOURCE_HAN_WEIGHT_SHA256: Readonly<Record<string, string>> = {
  ExtraLight: '3f0647f0f9ac2f684605f6870d8f916af243a7200998e69ea500334d877650ce',
  Light: '1df92a4f2587bd4214eaabf52cc1946c5b85e43e1f6a8bf9ed87ef882af7578d',
  Normal: '637a43c6aa32e85e51c8b2c073b3b4acf72305ed18ddec139f8f2266e898ca66',
  Regular: 'd8299926a5284f7461b46fa0617cc05d4f1fce8f034ffff78084225ce8b38071',
  Medium: 'b2a86d076a1bd8ff964ff55fd2419b78a80af3f8e21d8d3a38f0aa484aedcf94',
  Bold: 'f678def86be3d973e85fb0e34513b93b9ec7d6a478380d93fe79d43d1ad9f797',
  Heavy: 'bd67d7a106b48540662f87579dae049dbbc9e56553610aa7770d1e121db468bb',
}

/** 우리말샘 북한어 extract. CC BY-SA 2.0 KR. See data/README.md. */
export const NORTH_KOREAN_SHA256 = 'cdc67c66b3c5febf870a406188e9621dd3a72654b5e878de1e9fb25b40db6256'

/**
 * Gothic A1 Regular, SIL OFL, used only as the demo's Hangul body font.
 * google/fonts commit 16680f8688ffcd467d2eb2146a9ce0343404581d.
 */
export const GOTHIC_A1_URL = 'https://github.com/google/fonts/raw/16680f8688ffcd467d2eb2146a9ce0343404581d/ofl/gothica1/GothicA1-Regular.ttf'
export const GOTHIC_A1_SHA256 = '211151bea98098c579610ab1114bb1bfe909057207db561f357b896d076c21ac'

/**
 * Gowun Batang Regular, SIL OFL, Yanghee Ryu (류양희). Display serif for the local catalog.
 * google/fonts commit 539f6c4bb51e9b328dd5826bcbf2fd9b1ce56e19. The page ships a subset.
 */
export const GOWUN_BATANG_URL = 'https://github.com/google/fonts/raw/539f6c4bb51e9b328dd5826bcbf2fd9b1ce56e19/ofl/gowunbatang/GowunBatang-Regular.ttf'
export const GOWUN_BATANG_SHA256 = '466c593e7147412e748af4856d5ad14709b5a860bdf62b9c2546f2c5874e9849'
