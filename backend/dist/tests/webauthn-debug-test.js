"use strict";
/**
 * WebAuthn Debug Test
 * Tests WebAuthn service and identifies issues
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAuthnDebugTest = void 0;
const webauthnService_1 = require("../services/webauthnService");
/**
 * Debug WebAuthn implementation
 */
class WebAuthnDebugTest {
    /**
     * Run WebAuthn debugging tests
     */
    static async runAllTests() {
        console.log('🔍 Starting WebAuthn Debug Test Suite...');
        console.log('='.repeat(60));
        try {
            await this.testRegistrationOptions();
            await this.testService();
            console.log('✅ WebAuthn Debug tests completed');
        }
        catch (error) {
            console.error('❌ WebAuthn Debug tests FAILED:', error.message);
            throw error;
        }
    }
    /**
     * Test registration options generation
     */
    static async testRegistrationOptions() {
        console.log('\n🔐 Testing WebAuthn Registration Options...');
        const username = 'test_user';
        const displayName = 'Test User';
        try {
            const options = await webauthnService_1.WebAuthnService.generateRegistrationOptions(username, displayName);
            console.log('✅ Registration options generated:');
            console.log(`   RP Name: ${options.rp.name}`);
            console.log(`   RP ID: ${options.rp.id}`);
            console.log(`   User ID: ${options.user.id}`);
            console.log(`   User Name: ${options.user.name}`);
            console.log(`   Display Name: ${options.user.displayName}`);
            console.log(`   Challenge: ${options.challenge}`);
            console.log(`   Timeout: ${options.timeout}ms`);
            console.log(`   Algorithms: ${options.pubKeyCredParams.length}`);
            console.log(`   Authenticator Attachment: ${options.authenticatorSelection?.authenticatorAttachment || 'any (platform + cross-platform)'}`);
            console.log(`   User Verification: ${options.authenticatorSelection?.userVerification}`);
            console.log(`   Resident Key: ${options.authenticatorSelection?.residentKey}`);
            // Verify required fields
            if (!options.rp || !options.rp.name || !options.rp.id) {
                throw new Error('Missing required RP information');
            }
            if (!options.user || !options.user.id || !options.user.name) {
                throw new Error('Missing required user information');
            }
            if (!options.challenge) {
                throw new Error('Missing challenge');
            }
            if (!options.pubKeyCredParams || options.pubKeyCredParams.length === 0) {
                throw new Error('Missing public key credential parameters');
            }
            console.log('✅ Registration options validation PASSED');
        }
        catch (error) {
            console.error('❌ Registration options test failed:', error.message);
            throw error;
        }
    }
    /**
     * Test WebAuthn service functionality
     */
    static async testService() {
        console.log('\n🔍 Testing WebAuthn Service...');
        // Test environment configuration
        console.log(`📊 Environment Configuration:`);
        console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
        console.log(`   WEBAUTHN_RP_ID: ${process.env.WEBAUTHN_RP_ID || 'undefined'}`);
        console.log(`   WEBAUTHN_RP_NAME: ${process.env.WEBAUTHN_RP_NAME || 'undefined'}`);
        // Determine expected RP ID
        const expectedRpId = process.env.NODE_ENV === 'production' ?
            (process.env.WEBAUTHN_RP_ID || 'quankey.xyz') :
            'localhost';
        console.log(`   Expected RP ID: ${expectedRpId}`);
        // Test with different users
        const testUsers = [
            { username: 'test1', displayName: 'Test User 1' },
            { username: 'test2', displayName: 'Test User 2' }
        ];
        for (const user of testUsers) {
            console.log(`\\n📝 Testing user: ${user.username}`);
            const options = await webauthnService_1.WebAuthnService.generateRegistrationOptions(user.username, user.displayName);
            if (options.rp.id !== expectedRpId) {
                console.warn(`⚠️ RP ID mismatch: got ${options.rp.id}, expected ${expectedRpId}`);
            }
            else {
                console.log(`✅ RP ID correct: ${options.rp.id}`);
            }
            if (options.user.id !== user.username) {
                console.warn(`⚠️ User ID mismatch: got ${options.user.id}, expected ${user.username}`);
            }
            else {
                console.log(`✅ User ID correct: ${options.user.id}`);
            }
        }
        console.log('✅ WebAuthn Service test completed');
    }
}
exports.WebAuthnDebugTest = WebAuthnDebugTest;
// Export for direct execution
if (require.main === module) {
    WebAuthnDebugTest.runAllTests()
        .then(() => {
        console.log('\\n🎉 All WebAuthn Debug tests completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\\n💥 WebAuthn Debug test suite failed:', error);
        process.exit(1);
    });
}
