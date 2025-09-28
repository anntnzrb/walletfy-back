#!/bin/sh

# =============================================================================
# Walletfy Backend - Basic Auth → JWT Demo
# Focused demo for Basic Authentication to JWT token emission
# =============================================================================

set -e

# Colors and styling constants
GREEN=46
BLUE=39
RED=196

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Logging functions
log_info() {
    if command_exists gum; then
        gum log --level info "$1"
    else
        printf "[INFO] %s\n" "$1"
    fi
}

log_error() {
    if command_exists gum; then
        gum log --level error "$1"
    else
        printf "[ERROR] %s\n" "$1" >&2
    fi
}

log_success() {
    if command_exists gum; then
        gum log --level info "✅ $1"
    else
        printf "[SUCCESS] ✅ %s\n" "$1"
    fi
}

# Display header
show_header() {
    if command_exists gum; then
        gum style \
            --foreground $BLUE --border-foreground $BLUE --border double \
            --align center --width 50 --margin "1 2" --padding "2 4" \
            "🔑 Basic Auth → JWT Demo" \
            "Emisión de JWT vía Basic Auth"
    else
        echo "=================================="
        echo "🔑 Basic Auth → JWT Demo"
        echo "Emisión de JWT vía Basic Auth"
        echo "=================================="
    fi
}

# Demo function
demo_basic_auth() {
    base_url="http://localhost:3030"
    auth_endpoint="$base_url/api/v1/auth"
    
    # Use dynamic user to avoid conflicts
    demo_username="${1:-demo_basic_$(date +%s)}"
    demo_password="${2:-DemoPass123!}"
    user_created=false
    
    if command_exists gum; then
        gum style --foreground $GREEN --bold "🎬 Basic Auth → JWT Demo"
        echo "Username: $demo_username"
        echo "Endpoint: $auth_endpoint/basic"
    else
        echo "🎬 Basic Auth → JWT Demo"
        echo "Username: $demo_username"
        echo "Endpoint: $auth_endpoint/basic"
    fi
    echo ""

    # Check if server is running
    log_info "Checking server status..."
    if ! curl -s -f $base_url/health >/dev/null; then
        log_error "Server not running. Please start with: npm run dev"
        exit 1
    fi
    log_success "Server is running"
    echo ""

    # Demo step function
    demo_step() {
        step_name="$1"
        curl_cmd="$2"
        description="$3"

        if command_exists gum; then
            gum style --foreground $BLUE --bold "📋 $step_name"
        else
            echo "📋 $step_name"
        fi

        echo "Description: $description"
        echo ""
        echo "Command:"
        if command_exists gum; then
            echo "$curl_cmd" | gum format -t code
        else
            echo "  $curl_cmd"
        fi
        echo ""

        # Execute and capture response
        response=$(eval "$curl_cmd" 2>/dev/null)
        status=$?

        echo "Response:"
        if [ -n "$response" ]; then
            if command_exists jq; then
                echo "$response" | jq . 2>/dev/null || echo "$response"
            elif command_exists gum; then
                echo "$response" | gum format -t code 2>/dev/null || echo "$response"
            else
                echo "$response"
            fi
        else
            echo "(no response)"
        fi

        echo ""
        if [ $status -eq 0 ]; then
            log_success "$step_name completed"
        else
            log_error "$step_name failed"
        fi
        echo ""
    }

    # Step 1: Try Basic Auth with non-existent user (should fail)
    demo_step "Basic Auth with Non-existent User (Expected Failure)" \
        "curl -s -X POST -u '$demo_username:$demo_password' $auth_endpoint/basic" \
        "Attempt Basic Auth with user that doesn't exist - should return 401"

    # Check if user creation is needed
    if echo "$response" | grep -q "Invalid credentials"; then
        log_info "As expected, user doesn't exist. Creating user..."
        
        # Step 2: Create the user
        demo_step "Create Demo User" \
            "curl -s -X POST -H 'Content-Type: application/json' -d '{\"username\":\"$demo_username\",\"password\":\"$demo_password\"}' $auth_endpoint/register" \
            "Register the demo user for Basic Auth testing"
        
        if echo "$response" | grep -q "User registered successfully"; then
            user_created=true
            log_success "User created successfully"
        else
            log_error "Failed to create user"
            return 1
        fi
    fi

    # Step 3: Try Basic Auth again (should succeed now)
    demo_step "Basic Auth → JWT Token (After Registration)" \
        "curl -s -X POST -u '$demo_username:$demo_password' $auth_endpoint/basic" \
        "Get JWT token using Basic Authentication header (RFC 7617) - should work now"

    # Step 4: Test the JWT token
    if echo "$response" | grep -q '"token"'; then
        jwt_token=$(echo "$response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
        
        demo_step "Verify JWT Token" \
            "curl -s -H 'Authorization: Bearer $jwt_token' $auth_endpoint/profile" \
            "Test the received JWT token by accessing protected endpoint"
    fi

    # Step 5: Cleanup - Delete the demo user (optional)
    if [ "$user_created" = true ]; then
        echo ""
        log_info "Cleaning up demo user..."
        # Note: This would require a delete user endpoint which may not exist
        # For now, just inform that cleanup would happen here
        if command_exists gum; then
            gum style --foreground $GREEN "🧹 Demo user cleanup would happen here"
            gum style --foreground $GREEN "User '$demo_username' was created for this demo"
        else
            echo "🧹 Demo user cleanup would happen here"
            echo "User '$demo_username' was created for this demo"
        fi
    fi

    if command_exists gum; then
        gum style \
            --foreground $GREEN --border-foreground $GREEN --border rounded \
            --align center --width 40 --margin "1 2" --padding "1 2" \
            "🎉 Basic Auth Demo Complete!"
    else
        echo "=================================="
        echo "🎉 Basic Auth Demo Complete!"
        echo "=================================="
    fi
}

# Main execution
main() {
    show_header
    
    # Check if gum is available
    if ! command_exists gum; then
        log_info "💡 For enhanced UI, install gum: https://github.com/charmbracelet/gum"
        echo ""
    fi

    # Check for user credentials as arguments
    if [ $# -eq 0 ]; then
        echo "Usage: $0 [username] [password]"
        echo "Example: $0 demo_user DemoPass123!"
        echo ""
        echo "Will use default: demo_user / DemoPass123!"
        echo ""
        if command_exists gum; then
            if ! gum confirm "Continue with default credentials?"; then
                exit 0
            fi
        else
            printf "Continue with default credentials? [y/N]: "
            read -r answer
            case "$answer" in
                [Yy]|[Yy][Ee][Ss]) ;;
                *) exit 0 ;;
            esac
        fi
    fi

    demo_basic_auth "$@"
}

# Run main function
main "$@"