#include <napi.h>
#include <string>
#include <vector>
#include <memory>

// Direct ML-KEM and ML-DSA headers (bypass main libOQS)
extern "C" {
    // ML-KEM-768 direct functions
    int PQCLEAN_MLKEM768_CLEAN_crypto_kem_keypair(unsigned char *pk, unsigned char *sk);
    int PQCLEAN_MLKEM768_CLEAN_crypto_kem_enc(unsigned char *ct, unsigned char *ss, const unsigned char *pk);
    int PQCLEAN_MLKEM768_CLEAN_crypto_kem_dec(unsigned char *ss, const unsigned char *ct, const unsigned char *sk);
    
    // ML-DSA-65 direct functions  
    int PQCLEAN_MLDSA65_CLEAN_crypto_sign_keypair(unsigned char *pk, unsigned char *sk);
    int PQCLEAN_MLDSA65_CLEAN_crypto_sign(unsigned char *sm, size_t *smlen, const unsigned char *m, size_t mlen, const unsigned char *sk);
    int PQCLEAN_MLDSA65_CLEAN_crypto_sign_open(unsigned char *m, size_t *mlen, const unsigned char *sm, size_t smlen, const unsigned char *pk);
}

// Constants from NIST standards
#define MLKEM768_PUBLICKEYBYTES 1184
#define MLKEM768_SECRETKEYBYTES 2400
#define MLKEM768_CIPHERTEXTBYTES 1088
#define MLKEM768_SHAREDSECRETBYTES 32

#define MLDSA65_PUBLICKEYBYTES 1952
#define MLDSA65_SECRETKEYBYTES 4000
#define MLDSA65_SIGNATURE_BYTES 3309

class LibOQSDirectAddon : public Napi::ObjectWrap<LibOQSDirectAddon> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    LibOQSDirectAddon(const Napi::CallbackInfo& info);
    
private:
    // ML-KEM-768 methods
    Napi::Value GenerateKEMKeyPair(const Napi::CallbackInfo& info);
    Napi::Value KEMEncapsulate(const Napi::CallbackInfo& info);
    Napi::Value KEMDecapsulate(const Napi::CallbackInfo& info);
    
    // ML-DSA-65 methods  
    Napi::Value GenerateSignatureKeyPair(const Napi::CallbackInfo& info);
    Napi::Value SignData(const Napi::CallbackInfo& info);
    Napi::Value VerifySignature(const Napi::CallbackInfo& info);
    
    // Utility methods
    Napi::Value GetVersionInfo(const Napi::CallbackInfo& info);
    
    static Napi::FunctionReference constructor;
};

Napi::FunctionReference LibOQSDirectAddon::constructor;

LibOQSDirectAddon::LibOQSDirectAddon(const Napi::CallbackInfo& info) : Napi::ObjectWrap<LibOQSDirectAddon>(info) {
    // No initialization needed for direct calls
}

Napi::Object LibOQSDirectAddon::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);
    
    Napi::Function func = DefineClass(env, "LibOQSDirectAddon", {
        InstanceMethod("generateKEMKeyPair", &LibOQSDirectAddon::GenerateKEMKeyPair),
        InstanceMethod("kemEncapsulate", &LibOQSDirectAddon::KEMEncapsulate),
        InstanceMethod("kemDecapsulate", &LibOQSDirectAddon::KEMDecapsulate),
        InstanceMethod("generateSignatureKeyPair", &LibOQSDirectAddon::GenerateSignatureKeyPair),
        InstanceMethod("signData", &LibOQSDirectAddon::SignData),
        InstanceMethod("verifySignature", &LibOQSDirectAddon::VerifySignature),
        InstanceMethod("getVersionInfo", &LibOQSDirectAddon::GetVersionInfo)
    });
    
    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    
    exports.Set("LibOQSDirectAddon", func);
    return exports;
}

Napi::Value LibOQSDirectAddon::GenerateKEMKeyPair(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Allocate memory for ML-KEM-768 keys
        std::vector<uint8_t> public_key(MLKEM768_PUBLICKEYBYTES);
        std::vector<uint8_t> secret_key(MLKEM768_SECRETKEYBYTES);
        
        // Generate key pair using direct PQCLEAN function
        int result = PQCLEAN_MLKEM768_CLEAN_crypto_kem_keypair(public_key.data(), secret_key.data());
        
        if (result != 0) {
            Napi::Error::New(env, "Failed to generate ML-KEM-768 key pair").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Create return object
        Napi::Object keyPair = Napi::Object::New(env);
        keyPair.Set("publicKey", Napi::Buffer<uint8_t>::Copy(env, public_key.data(), public_key.size()));
        keyPair.Set("secretKey", Napi::Buffer<uint8_t>::Copy(env, secret_key.data(), secret_key.size()));
        keyPair.Set("algorithm", Napi::String::New(env, "ML-KEM-768"));
        keyPair.Set("publicKeyLength", Napi::Number::New(env, MLKEM768_PUBLICKEYBYTES));
        keyPair.Set("secretKeyLength", Napi::Number::New(env, MLKEM768_SECRETKEYBYTES));
        keyPair.Set("ciphertextLength", Napi::Number::New(env, MLKEM768_CIPHERTEXTBYTES));
        keyPair.Set("sharedSecretLength", Napi::Number::New(env, MLKEM768_SHAREDSECRETBYTES));
        
        return keyPair;
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Exception in GenerateKEMKeyPair: ") + e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value LibOQSDirectAddon::GenerateSignatureKeyPair(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Allocate memory for ML-DSA-65 keys
        std::vector<uint8_t> public_key(MLDSA65_PUBLICKEYBYTES);
        std::vector<uint8_t> secret_key(MLDSA65_SECRETKEYBYTES);
        
        // Generate key pair using direct PQCLEAN function
        int result = PQCLEAN_MLDSA65_CLEAN_crypto_sign_keypair(public_key.data(), secret_key.data());
        
        if (result != 0) {
            Napi::Error::New(env, "Failed to generate ML-DSA-65 key pair").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Create return object
        Napi::Object keyPair = Napi::Object::New(env);
        keyPair.Set("publicKey", Napi::Buffer<uint8_t>::Copy(env, public_key.data(), public_key.size()));
        keyPair.Set("secretKey", Napi::Buffer<uint8_t>::Copy(env, secret_key.data(), secret_key.size()));
        keyPair.Set("algorithm", Napi::String::New(env, "ML-DSA-65"));
        keyPair.Set("publicKeyLength", Napi::Number::New(env, MLDSA65_PUBLICKEYBYTES));
        keyPair.Set("secretKeyLength", Napi::Number::New(env, MLDSA65_SECRETKEYBYTES));
        keyPair.Set("maxSignatureLength", Napi::Number::New(env, MLDSA65_SIGNATURE_BYTES));
        
        return keyPair;
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Exception in GenerateSignatureKeyPair: ") + e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value LibOQSDirectAddon::SignData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsBuffer() || !info[1].IsBuffer()) {
        Napi::TypeError::New(env, "Expected (data: Buffer, secretKey: Buffer)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        // Get input data
        Napi::Buffer<uint8_t> data_buffer = info[0].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> secret_key_buffer = info[1].As<Napi::Buffer<uint8_t>>();
        
        // Allocate memory for signature
        std::vector<uint8_t> signed_message(data_buffer.Length() + MLDSA65_SIGNATURE_BYTES);
        size_t signed_message_length = 0;
        
        // Sign the data using direct PQCLEAN function
        int result = PQCLEAN_MLDSA65_CLEAN_crypto_sign(
            signed_message.data(),
            &signed_message_length,
            data_buffer.Data(),
            data_buffer.Length(),
            secret_key_buffer.Data()
        );
        
        if (result != 0) {
            Napi::Error::New(env, "Failed to sign data with ML-DSA-65").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Extract just the signature part (first MLDSA65_SIGNATURE_BYTES)
        std::vector<uint8_t> signature(signed_message.begin(), signed_message.begin() + MLDSA65_SIGNATURE_BYTES);
        
        return Napi::Buffer<uint8_t>::Copy(env, signature.data(), signature.size());
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Exception in SignData: ") + e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value LibOQSDirectAddon::VerifySignature(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 3 || !info[0].IsBuffer() || !info[1].IsBuffer() || !info[2].IsBuffer()) {
        Napi::TypeError::New(env, "Expected (data: Buffer, signature: Buffer, publicKey: Buffer)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        // Get input data
        Napi::Buffer<uint8_t> data_buffer = info[0].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> signature_buffer = info[1].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> public_key_buffer = info[2].As<Napi::Buffer<uint8_t>>();
        
        // Reconstruct signed message (signature + data)
        std::vector<uint8_t> signed_message(signature_buffer.Length() + data_buffer.Length());
        std::copy(signature_buffer.Data(), signature_buffer.Data() + signature_buffer.Length(), signed_message.begin());
        std::copy(data_buffer.Data(), data_buffer.Data() + data_buffer.Length(), signed_message.begin() + signature_buffer.Length());
        
        // Allocate memory for recovered message
        std::vector<uint8_t> recovered_message(data_buffer.Length());
        size_t recovered_message_length = 0;
        
        // Verify the signature using direct PQCLEAN function
        int result = PQCLEAN_MLDSA65_CLEAN_crypto_sign_open(
            recovered_message.data(),
            &recovered_message_length,
            signed_message.data(),
            signed_message.size(),
            public_key_buffer.Data()
        );
        
        return Napi::Boolean::New(env, result == 0);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Exception in VerifySignature: ") + e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Stub methods for KEM operations
Napi::Value LibOQSDirectAddon::KEMEncapsulate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // TODO: Implement KEM encapsulation for password encryption
    Napi::Error::New(env, "KEMEncapsulate not yet implemented").ThrowAsJavaScriptException();
    return env.Null();
}

Napi::Value LibOQSDirectAddon::KEMDecapsulate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // TODO: Implement KEM decapsulation for password decryption
    Napi::Error::New(env, "KEMDecapsulate not yet implemented").ThrowAsJavaScriptException();
    return env.Null();
}

Napi::Value LibOQSDirectAddon::GetVersionInfo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    Napi::Object versionInfo = Napi::Object::New(env);
    versionInfo.Set("library", Napi::String::New(env, "libOQS-direct"));
    versionInfo.Set("version", Napi::String::New(env, "1.0.0-direct"));
    versionInfo.Set("algorithms", Napi::String::New(env, "ML-KEM-768, ML-DSA-65"));
    versionInfo.Set("mode", Napi::String::New(env, "DIRECT_PQCLEAN"));
    
    return versionInfo;
}

// Module initialization
Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return LibOQSDirectAddon::Init(env, exports);
}

NODE_API_MODULE(liboqs_native, InitAll)