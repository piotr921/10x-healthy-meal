#!/bin/bash

# Test script for PUT /api/recipes/{id} endpoint
# This script tests all error scenarios and success cases

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api/recipes"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Testing PUT /api/recipes/{id} Endpoint"
echo "========================================"
echo ""

# First, create a recipe to test with
echo "Step 0: Creating test recipes..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/recipes" \
  -H "Content-Type: application/json" \
  -d '{"title": "Original Recipe", "content": "Original content for testing"}')

RECIPE_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
echo -e "${GREEN}✓${NC} Created test recipe with ID: $RECIPE_ID"

# Create another recipe for duplicate title testing
CREATE_RESPONSE_2=$(curl -s -X POST "$BASE_URL/api/recipes" \
  -H "Content-Type: application/json" \
  -d '{"title": "Another Recipe", "content": "Another content for duplicate testing"}')

RECIPE_ID_2=$(echo $CREATE_RESPONSE_2 | jq -r '.id')
echo -e "${GREEN}✓${NC} Created second test recipe with ID: $RECIPE_ID_2"
echo ""

# Test 1: Invalid UUID format (400)
echo "Test 1: Invalid UUID format (should return 400)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/invalid-uuid" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "content": "Updated content"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 400"
  echo "   Response: $(echo $BODY | jq -r '.error.message')"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 2: Non-existent recipe (404)
echo "Test 2: Non-existent recipe ID (should return 404)"
FAKE_UUID="123e4567-e89b-12d3-a456-426614174000"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$FAKE_UUID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "content": "Updated content"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "404" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 404"
  echo "   Response: $(echo $BODY | jq -r '.error.message')"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 404, got $HTTP_CODE"
fi
echo ""

# Test 3: Missing title in request body (400)
echo "Test 3: Missing title in request body (should return 400)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -d '{"content": "Only content, no title"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 400"
  echo "   Response: $(echo $BODY | jq -r '.error.message')"
  echo "   Details: $(echo $BODY | jq -r '.error.details[0].message')"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 4: Missing content in request body (400)
echo "Test 4: Missing content in request body (should return 400)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Only title, no content"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 400"
  echo "   Response: $(echo $BODY | jq -r '.error.message')"
  echo "   Details: $(echo $BODY | jq -r '.error.details[0].message')"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 5: Title too long (400)
echo "Test 5: Title too long - over 200 characters (should return 400)"
LONG_TITLE=$(printf 'A%.0s' {1..201})
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"$LONG_TITLE\", \"content\": \"Some content\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 400"
  echo "   Response: $(echo $BODY | jq -r '.error.message')"
  echo "   Details: $(echo $BODY | jq -r '.error.details[0].message')"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 6: Empty title (400)
echo "Test 6: Empty title (should return 400)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "", "content": "Some content"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 400"
  echo "   Response: $(echo $BODY | jq -r '.error.message')"
  echo "   Details: $(echo $BODY | jq -r '.error.details[0].message')"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 7: Invalid JSON (400)
echo "Test 7: Invalid JSON in request body (should return 400)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -d '{invalid json}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 400"
  echo "   Response: $(echo $BODY | jq -r '.error.message')"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 8: Duplicate title (409)
echo "Test 8: Duplicate title with another recipe (should return 409)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Another Recipe", "content": "Trying to use existing title"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "409" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 409"
  echo "   Response: $(echo $BODY | jq -r '.error.message')"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 409, got $HTTP_CODE"
fi
echo ""

# Test 9: SUCCESS - Valid update (200)
echo "Test 9: Valid update (should return 200)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Recipe Title", "content": "This is the updated content"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 200"
  
  # Verify response structure
  RETURNED_ID=$(echo $BODY | jq -r '.id')
  RETURNED_TITLE=$(echo $BODY | jq -r '.title')
  RETURNED_CONTENT=$(echo $BODY | jq -r '.content')
  UPDATE_COUNTER=$(echo $BODY | jq -r '.update_counter')
  CREATED_AT=$(echo $BODY | jq -r '.created_at')
  UPDATED_AT=$(echo $BODY | jq -r '.updated_at')
  
  echo "   Recipe ID: $RETURNED_ID"
  echo "   Title: $RETURNED_TITLE"
  echo "   Content: $RETURNED_CONTENT"
  echo "   Update Counter: $UPDATE_COUNTER"
  echo "   Created At: $CREATED_AT"
  echo "   Updated At: $UPDATED_AT"
  
  # Verify update_counter incremented
  if [ "$UPDATE_COUNTER" = "2" ]; then
    echo -e "   ${GREEN}✓${NC} Update counter incremented correctly (was 1, now 2)"
  else
    echo -e "   ${RED}✗${NC} Update counter incorrect: expected 2, got $UPDATE_COUNTER"
  fi
  
  # Verify updated_at is different from created_at
  if [ "$UPDATED_AT" != "$CREATED_AT" ]; then
    echo -e "   ${GREEN}✓${NC} Updated timestamp changed"
  else
    echo -e "   ${YELLOW}⚠${NC} Updated timestamp same as created (may be timing issue)"
  fi
else
  echo -e "${RED}✗ FAIL${NC} - Expected 200, got $HTTP_CODE"
  echo "   Response: $BODY"
fi
echo ""

# Test 10: Update with same title (should be allowed - 200)
echo "Test 10: Update recipe keeping the same title (should return 200)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$RECIPE_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Recipe Title", "content": "Content changed again"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 200"
  UPDATE_COUNTER=$(echo $BODY | jq -r '.update_counter')
  echo "   Update Counter: $UPDATE_COUNTER"
  
  if [ "$UPDATE_COUNTER" = "3" ]; then
    echo -e "   ${GREEN}✓${NC} Update counter incremented correctly (was 2, now 3)"
  else
    echo -e "   ${RED}✗${NC} Update counter incorrect: expected 3, got $UPDATE_COUNTER"
  fi
else
  echo -e "${RED}✗ FAIL${NC} - Expected 200, got $HTTP_CODE"
  echo "   Response: $BODY"
fi
echo ""

# Test 11: Verify GET returns updated data
echo "Test 11: Verify GET returns the updated recipe"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/$RECIPE_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  TITLE=$(echo $BODY | jq -r '.title')
  CONTENT=$(echo $BODY | jq -r '.content')
  UPDATE_COUNTER=$(echo $BODY | jq -r '.update_counter')
  
  if [ "$TITLE" = "Updated Recipe Title" ] && [ "$CONTENT" = "Content changed again" ] && [ "$UPDATE_COUNTER" = "3" ]; then
    echo -e "${GREEN}✓ PASS${NC} - GET returned correct updated data"
    echo "   Title: $TITLE"
    echo "   Content: $CONTENT"
    echo "   Update Counter: $UPDATE_COUNTER"
  else
    echo -e "${RED}✗ FAIL${NC} - GET returned incorrect data"
    echo "   Response: $BODY"
  fi
else
  echo -e "${RED}✗ FAIL${NC} - GET failed with status $HTTP_CODE"
fi
echo ""

echo "========================================"
echo "Test Summary Complete"
echo "========================================"

