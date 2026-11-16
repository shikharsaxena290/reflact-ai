
from pinecone import Pinecone, ServerlessSpec
from src.config import get_settings

s = get_settings()
pc = Pinecone(api_key=s.pinecone_api_key)

index_name = "reflactai"

if not pc.has_index(index_name):
    pc.create_index(
        name=index_name,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        )
    )

print("Index created successfully!")
print(pc.describe_index(index_name))
