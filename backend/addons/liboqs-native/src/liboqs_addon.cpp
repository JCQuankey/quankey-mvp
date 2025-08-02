#include <napi.h>
#include <string>
#include <vector>
#include <memory>

// libOQS headers
extern "C" {
    #include <oqs/oqs.h>
    #include <oqs/kem_ml_kem.h>
    #include <oqs/sig_ml_dsa.h>
}

class LibOQSAddon : public Napi::ObjectWrap<LibOQSAddon> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    LibOQSAddon(const Napi::CallbackInfo& info);
    
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
    Napi::Value GetAvailableAlgorithms(const Napi::CallbackInfo& info);
    Napi::Value GetLibOQSVersion(const Napi::CallbackInfo& info);
    
    static Napi::FunctionReference constructor;
};

Napi::FunctionReference LibOQSAddon::constructor;

LibOQSAddon::LibOQSAddon(const Napi::CallbackInfo& info) : Napi::ObjectWrap<LibOQSAddon>(info) {
    // Initialize libOQS
    OQS_init();
}

Napi::Object LibOQSAddon::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);
    
    Napi::Function func = DefineClass(env, "LibOQSAddon", {
        InstanceMethod("generateKEMKeyPair", &LibOQSAddon::GenerateKEMKeyPair),
        InstanceMethod("kemEncapsulate", &LibOQSAddon::KEMEncapsulate),
        InstanceMethod("kemDecapsulate", &LibOQSAddon::KEMDecapsulate),
        InstanceMethod("generateSignatureKeyPair", &LibOQSAddon::GenerateSignatureKeyPair),
        InstanceMethod("signData", &LibOQSAddon::SignData),
        InstanceMethod("verifySignature", &LibOQSAddon::VerifySignature),
        InstanceMethod("getAvailableAlgorithms", &LibOQSAddon::GetAvailableAlgorithms),
        InstanceMethod("getLibOQSVersion", &LibOQSAddon::GetLibOQSVersion)
    });
    
    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    
    exports.Set("LibOQSAddon", func);
    return exports;
}

Napi::Value LibOQSAddon::GenerateKEMKeyPair(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Create ML-KEM-768 instance
        OQS_KEM* kem = OQS_KEM_new(OQS_KEM_alg_ml_kem_768);
        if (!kem) {
            Napi::Error::New(env, "Failed to create ML-KEM-768 instance").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Allocate memory for keys
        std::vector<uint8_t> public_key(kem->length_public_key);
        std::vector<uint8_t> secret_key(kem->length_secret_key);
        
        // Generate key pair
        OQS_STATUS status = OQS_KEM_keypair(kem, public_key.data(), secret_key.data());
        
        if (status != OQS_SUCCESS) {
            OQS_KEM_free(kem);
            Napi::Error::New(env, "Failed to generate ML-KEM-768 key pair").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Create return object
        Napi::Object result = Napi::Object::New(env);
        result.Set("publicKey", Napi::Buffer<uint8_t>::Copy(env, public_key.data(), public_key.size()));
        result.Set("secretKey", Napi::Buffer<uint8_t>::Copy(env, secret_key.data(), secret_key.size()));
        result.Set("algorithm", Napi::String::New(env, "ML-KEM-768"));
        result.Set("publicKeyLength", Napi::Number::New(env, kem->length_public_key));
        result.Set("secretKeyLength", Napi::Number::New(env, kem->length_secret_key));
        result.Set("ciphertextLength", Napi::Number::New(env, kem->length_ciphertext));
        result.Set("sharedSecretLength", Napi::Number::New(env, kem->length_shared_secret));
        
        OQS_KEM_free(kem);
        return result;
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Exception in GenerateKEMKeyPair: ") + e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value LibOQSAddon::GenerateSignatureKeyPair(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        // Create ML-DSA-65 instance
        OQS_SIG* sig = OQS_SIG_new(OQS_SIG_alg_ml_dsa_65);
        if (!sig) {
            Napi::Error::New(env, "Failed to create ML-DSA-65 instance").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Allocate memory for keys
        std::vector<uint8_t> public_key(sig->length_public_key);
        std::vector<uint8_t> secret_key(sig->length_secret_key);
        
        // Generate key pair
        OQS_STATUS status = OQS_SIG_keypair(sig, public_key.data(), secret_key.data());
        
        if (status != OQS_SUCCESS) {
            OQS_SIG_free(sig);
            Napi::Error::New(env, "Failed to generate ML-DSA-65 key pair").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Create return object
        Napi::Object result = Napi::Object::New(env);
        result.Set("publicKey", Napi::Buffer<uint8_t>::Copy(env, public_key.data(), public_key.size()));
        result.Set("secretKey", Napi::Buffer<uint8_t>::Copy(env, secret_key.data(), secret_key.size()));
        result.Set("algorithm", Napi::String::New(env, "ML-DSA-65"));
        result.Set("publicKeyLength", Napi::Number::New(env, sig->length_public_key));
        result.Set("secretKeyLength", Napi::Number::New(env, sig->length_secret_key));
        result.Set("maxSignatureLength", Napi::Number::New(env, sig->length_signature));
        
        OQS_SIG_free(sig);
        return result;
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Exception in GenerateSignatureKeyPair: ") + e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value LibOQSAddon::SignData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsBuffer() || !info[1].IsBuffer()) {
        Napi::TypeError::New(env, "Expected (data: Buffer, secretKey: Buffer)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        // Get input data
        Napi::Buffer<uint8_t> data_buffer = info[0].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> secret_key_buffer = info[1].As<Napi::Buffer<uint8_t>>();
        
        // Create ML-DSA-65 instance
        OQS_SIG* sig = OQS_SIG_new(OQS_SIG_alg_ml_dsa_65);
        if (!sig) {
            Napi::Error::New(env, "Failed to create ML-DSA-65 instance").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Allocate memory for signature
        std::vector<uint8_t> signature(sig->length_signature);
        size_t signature_length = 0;
        
        // Sign the data
        OQS_STATUS status = OQS_SIG_sign(
            sig,
            signature.data(),
            &signature_length,
            data_buffer.Data(),
            data_buffer.Length(),
            secret_key_buffer.Data()
        );
        
        if (status != OQS_SUCCESS) {
            OQS_SIG_free(sig);
            Napi::Error::New(env, "Failed to sign data with ML-DSA-65").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Resize signature to actual length
        signature.resize(signature_length);
        
        OQS_SIG_free(sig);
        return Napi::Buffer<uint8_t>::Copy(env, signature.data(), signature.size());
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Exception in SignData: ") + e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value LibOQSAddon::VerifySignature(const Napi::CallbackInfo& info) {
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
        
        // Create ML-DSA-65 instance
        OQS_SIG* sig = OQS_SIG_new(OQS_SIG_alg_ml_dsa_65);
        if (!sig) {
            Napi::Error::New(env, "Failed to create ML-DSA-65 instance").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Verify the signature
        OQS_STATUS status = OQS_SIG_verify(
            sig,
            data_buffer.Data(),
            data_buffer.Length(),
            signature_buffer.Data(),
            signature_buffer.Length(),
            public_key_buffer.Data()
        );
        
        OQS_SIG_free(sig);
        return Napi::Boolean::New(env, status == OQS_SUCCESS);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Exception in VerifySignature: ") + e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value LibOQSAddon::GetAvailableAlgorithms(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        Napi::Object result = Napi::Object::New(env);
        Napi::Array kems = Napi::Array::New(env);
        Napi::Array sigs = Napi::Array::New(env);
        
        // Get available KEM algorithms
        for (size_t i = 0; i < OQS_KEM_algs_length; i++) {
            const char* alg_name = OQS_KEM_alg_identifier(i);
            if (alg_name) {
                kems.Set(i, Napi::String::New(env, alg_name));
            }
        }
        
        // Get available signature algorithms
        for (size_t i = 0; i < OQS_SIG_algs_length; i++) {
            const char* alg_name = OQS_SIG_alg_identifier(i);
            if (alg_name) {
                sigs.Set(i, Napi::String::New(env, alg_name));
            }
        }
        
        result.Set("kems", kems);
        result.Set("signatures", sigs);
        
        return result;
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Exception in GetAvailableAlgorithms: ") + e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value LibOQSAddon::GetLibOQSVersion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    return Napi::String::New(env, OQS_VERSION_TEXT);
}

// Stub methods for KEM encapsulation (for future implementation)
Napi::Value LibOQSAddon::KEMEncapsulate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // TODO: Implement KEM encapsulation for password encryption
    Napi::Error::New(env, "KEMEncapsulate not yet implemented").ThrowAsJavaScriptException();
    return env.Null();
}

Napi::Value LibOQSAddon::KEMDecapsulate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // TODO: Implement KEM decapsulation for password decryption
    Napi::Error::New(env, "KEMDecapsulate not yet implemented").ThrowAsJavaScriptException();
    return env.Null();
}

// Module initialization
Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return LibOQSAddon::Init(env, exports);
}

NODE_API_MODULE(liboqs_native, InitAll)