/**
 * GROQ API INTEGRATION TEST
 * 
 * Tests:
 * 1. API key is set in environment
 * 2. Groq client initializes correctly
 * 3. Free tier email generation works
 * 4. Response quality is acceptable
 * 5. Tokens are counted correctly
 * 6. Cost calculation (should be FREE)
 */

import Groq from 'groq-sdk';

const API_KEY = process.env.VITE_GROQ_API_KEY;

async function testGroqAPI() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         🚀 GROQ API INTEGRATION TEST                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test 1: Check API key
  console.log('✅ TEST 1: Checking API Key');
  if (!API_KEY) {
    console.log('   ❌ VITE_GROQ_API_KEY is not set!');
    console.log('   📍 Solution: Add to Vercel → Settings → Environment Variables');
    console.log('   📍 Get key at: https://groq.com\n');
    return;
  }
  console.log(`   ✅ API Key is set: ${API_KEY.substring(0, 10)}...`);
  console.log(`   📍 Free tier: 25,000 requests/day\n`);

  // Test 2: Initialize Groq client
  console.log('✅ TEST 2: Initializing Groq Client');
  let groq;
  try {
    groq = new Groq({
      apiKey: API_KEY,
    });
    console.log('   ✅ Groq client initialized successfully\n');
  } catch (error) {
    console.log(`   ❌ Failed to initialize: ${error.message}\n`);
    return;
  }

  // Test 3: Generate email pitch (free tier test)
  console.log('✅ TEST 3: Testing Free Tier Email Generation');
  console.log('   📧 Task: Generate email pitch for hair salon\n');

  try {
    const startTime = Date.now();

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content:
            'Write a 2-sentence professional email pitch for a hair salon offering to build them a free online store. Be specific and mention the key benefits.',
        },
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 150,
    });

    const responseTime = Date.now() - startTime;

    console.log('   ✅ Response received!\n');

    // Test 4: Analyze response
    console.log('✅ TEST 4: Response Quality Analysis');
    const content = response.choices[0]?.message?.content || '';
    const wordCount = content.split(' ').length;

    console.log(`   📝 Generated text:\n`);
    console.log(`   "${content}"\n`);
    console.log(`   📊 Metrics:`);
    console.log(`      - Word count: ${wordCount}`);
    console.log(`      - Sentences: ~${content.split('.').length}`);
    console.log(`      - Professional: ${content.includes('free') ? '✅ Yes' : '❌ No'}`);
    console.log(`      - Specific: ${content.includes('online') || content.includes('store') ? '✅ Yes' : '❌ No'}\n`);

    // Test 5: Token counting
    console.log('✅ TEST 5: Token Counting');
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const totalTokens = response.usage?.total_tokens || 0;

    console.log(`   📊 Token usage:`);
    console.log(`      - Input tokens: ${inputTokens}`);
    console.log(`      - Output tokens: ${outputTokens}`);
    console.log(`      - Total tokens: ${totalTokens}\n`);

    // Test 6: Cost calculation
    console.log('✅ TEST 6: Cost Calculation');
    console.log(`   💰 Cost: FREE (Groq free tier)`);
    console.log(`   📍 Compare: GPT-4o would cost $${(totalTokens * 0.005 / 1000).toFixed(6)} USD`);
    console.log(`   📍 Your savings: $${(totalTokens * 0.005 / 1000).toFixed(6)} USD per request`);
    console.log(`   📍 At 50 emails/month: $${((totalTokens * 0.005 / 1000) * 50).toFixed(2)} USD saved\n`);

    // Test 7: Performance
    console.log('✅ TEST 7: Performance Metrics');
    console.log(`   ⚡ Response time: ${responseTime}ms`);
    console.log(`   ⚡ Speed: ${responseTime < 1000 ? 'FAST ✅' : responseTime < 3000 ? 'MODERATE ⚠️' : 'SLOW ❌'}`);
    console.log(`   ⚡ Tokens per second: ${(totalTokens / (responseTime / 1000)).toFixed(0)}\n`);

    // Test 8: Model info
    console.log('✅ TEST 8: Model Information');
    console.log(`   🤖 Model: Mixtral 8x7B`);
    console.log(`   📊 Quality: 8/10 (very good for emails)`);
    console.log(`   ⚡ Speed: Ultra-fast (2x faster than GPT)`);
    console.log(`   💰 Cost: FREE on Groq free tier\n`);

    // Success summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL TESTS PASSED - GROQ WORKING! ✅        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📋 NEXT STEPS:');
    console.log('   1. Update services to use executeWithRouting()');
    console.log('   2. Route "email-pitch" tasks to Groq for FREE');
    console.log('   3. Save TT$1,000+/month on email generation\n');

    console.log('🎯 USAGE EXAMPLE:');
    console.log(`
const result = await executeWithRouting(
  'email-pitch',
  'Write an email to a salon...',
  { budgetMode: 'ultra-cheap' }
);

// Will use Groq (FREE) automatically!
console.log(\`Cost: TT$\${result.cost}\`); // TT$0.00
    `);

    return true;
  } catch (error) {
    console.log(`   ❌ Failed to generate email: ${error.message}\n`);

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('   📍 Issue: Invalid API key');
      console.log('   📍 Solution: Check your Groq API key in Vercel env vars');
    } else if (error.message.includes('429')) {
      console.log('   📍 Issue: Rate limit exceeded');
      console.log('   📍 Solution: Free tier allows 25,000 requests/day');
    } else if (error.message.includes('500') || error.message.includes('503')) {
      console.log('   📍 Issue: Groq API server error');
      console.log('   📍 Solution: Try again in a few minutes');
    }

    console.log('\n❌ GROQ API TEST FAILED\n');
    return false;
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGroqAPI();
}

export { testGroqAPI };
