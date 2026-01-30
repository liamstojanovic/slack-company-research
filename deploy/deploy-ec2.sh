#!/bin/bash
set -e

# Configuration
INSTANCE_NAME="slack-research-bot"
AWS_REGION="${AWS_REGION:-us-east-1}"
INSTANCE_TYPE="t3.micro"
KEY_NAME="slack-research-bot-key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Slack Research Bot EC2 Deployment ===${NC}"

# Check AWS_PROFILE
if [ -z "$AWS_PROFILE" ]; then
    echo -e "${RED}Error: AWS_PROFILE environment variable is not set${NC}"
    exit 1
fi
echo -e "Using AWS Profile: ${YELLOW}${AWS_PROFILE}${NC}"

# Check SLACK_BOT_USER_OAUTH_ACCESS_TOKEN
if [ -z "$SLACK_BOT_USER_OAUTH_ACCESS_TOKEN" ]; then
    echo -e "${RED}Error: SLACK_BOT_USER_OAUTH_ACCESS_TOKEN environment variable is not set${NC}"
    exit 1
fi

cd "$(dirname "$0")/.."

echo -e "${GREEN}[1/6] Getting latest Amazon Linux 2023 AMI...${NC}"
AMI_ID=$(aws ec2 describe-images --region $AWS_REGION \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-2023*-x86_64" \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
    --output text)
echo "AMI: $AMI_ID"

echo -e "${GREEN}[2/6] Setting up key pair...${NC}"
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME --region $AWS_REGION 2>/dev/null; then
    echo "Creating new key pair..."
    aws ec2 create-key-pair --key-name $KEY_NAME --region $AWS_REGION \
        --query 'KeyMaterial' --output text > deploy/$KEY_NAME.pem
    chmod 400 deploy/$KEY_NAME.pem
    echo -e "${GREEN}Key saved to deploy/$KEY_NAME.pem${NC}"
else
    echo "Key pair already exists"
fi

echo -e "${GREEN}[3/6] Setting up security group...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --region $AWS_REGION --query 'Vpcs[0].VpcId' --output text)
SG_NAME="slack-research-bot-sg"

SG_ID=$(aws ec2 describe-security-groups --region $AWS_REGION \
    --filters "Name=group-name,Values=$SG_NAME" \
    --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    echo "Creating security group..."
    SG_ID=$(aws ec2 create-security-group \
        --group-name $SG_NAME \
        --description "Security group for Slack Research Bot" \
        --vpc-id $VPC_ID \
        --region $AWS_REGION \
        --query 'GroupId' --output text)

    # Allow SSH
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION
    # Allow HTTP on port 3000
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $AWS_REGION
fi
echo "Security Group: $SG_ID"

echo -e "${GREEN}[4/6] Getting public subnet...${NC}"
SUBNET_ID=$(aws ec2 describe-subnets --region $AWS_REGION \
    --query 'Subnets[?MapPublicIpOnLaunch==`true`]|[0].SubnetId' --output text)
echo "Subnet: $SUBNET_ID"

echo -e "${GREEN}[5/6] Creating user data script...${NC}"
cat > deploy/user-data.sh << 'USERDATA'
#!/bin/bash
set -e

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs git

# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/yum.repos.d/ngrok.repo
yum install -y ngrok

# Create app directory
mkdir -p /opt/slack-research-bot
cd /opt/slack-research-bot

# Clone or copy app (we'll use git clone for simplicity)
# For now, create placeholder - you'll need to copy files via SCP
echo "App directory ready at /opt/slack-research-bot"

# Create systemd service
cat > /etc/systemd/system/slack-research-bot.service << 'EOF'
[Unit]
Description=Slack Research Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/slack-research-bot
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
EnvironmentFile=/opt/slack-research-bot/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
USERDATA

echo -e "${GREEN}[6/6] Launching EC2 instance...${NC}"

# Check if instance already exists
EXISTING_INSTANCE=$(aws ec2 describe-instances --region $AWS_REGION \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,pending" \
    --query 'Reservations[0].Instances[0].InstanceId' --output text 2>/dev/null || echo "None")

if [ "$EXISTING_INSTANCE" != "None" ] && [ -n "$EXISTING_INSTANCE" ]; then
    echo -e "${YELLOW}Instance already exists: $EXISTING_INSTANCE${NC}"
    INSTANCE_ID=$EXISTING_INSTANCE
else
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id $AMI_ID \
        --instance-type $INSTANCE_TYPE \
        --key-name $KEY_NAME \
        --security-group-ids $SG_ID \
        --subnet-id $SUBNET_ID \
        --user-data file://deploy/user-data.sh \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
        --region $AWS_REGION \
        --query 'Instances[0].InstanceId' --output text)

    echo "Waiting for instance to start..."
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION
fi

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --region $AWS_REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "Instance ID: ${YELLOW}$INSTANCE_ID${NC}"
echo -e "Public IP: ${YELLOW}$PUBLIC_IP${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Wait ~2 minutes for instance initialization"
echo ""
echo "2. Copy your app to the instance:"
echo -e "   ${GREEN}rsync -avz -e \"ssh -i deploy/$KEY_NAME.pem\" --exclude node_modules --exclude .git . ec2-user@$PUBLIC_IP:/opt/slack-research-bot/${NC}"
echo ""
echo "3. SSH into the instance:"
echo -e "   ${GREEN}ssh -i deploy/$KEY_NAME.pem ec2-user@$PUBLIC_IP${NC}"
echo ""
echo "4. On the instance, install dependencies and start:"
echo "   cd /opt/slack-research-bot"
echo "   npm install"
echo "   echo 'SLACK_BOT_USER_OAUTH_ACCESS_TOKEN=$SLACK_BOT_USER_OAUTH_ACCESS_TOKEN' > .env"
echo "   npm run dev"
echo ""
echo "5. In another terminal, set up ngrok:"
echo "   ngrok config add-authtoken YOUR_NGROK_TOKEN"
echo "   ngrok http 3000"
echo ""
echo "6. Use the ngrok URL for your Slack slash command"
