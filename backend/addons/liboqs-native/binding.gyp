{
  "targets": [
    {
      "target_name": "liboqs_native",
      "sources": [
        "src/liboqs_addon_direct.cpp"
      ],
      "include_dirs": [
        "C:/Users/JuanCano/dev/quankey-mvp/backend/addons/liboqs-native/node_modules/node-addon-api",
        "C:/Users/JuanCano/dev/liboqs/build/include"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "conditions": [
        ["OS=='win'", {
          "libraries": [
            "C:/Users/JuanCano/dev/liboqs/build/src/kem/ml_kem/ml_kem_768_ref.dir/Release/ml_kem_768_ref.lib",
            "C:/Users/JuanCano/dev/liboqs/build/src/sig/ml_dsa/ml_dsa_65_ref.dir/Release/ml_dsa_65_ref.lib",
            "C:/Users/JuanCano/dev/liboqs/build/src/common/common.dir/Release/common.lib"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalIncludeDirectories": [
                "C:/Users/JuanCano/dev/liboqs/build/include"
              ]
            }
          }
        }]
      ]
    }
  ]
}