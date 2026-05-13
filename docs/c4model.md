# C4 Model: AI Auto-workflow Search & Recommendations

Tài liệu này đặc tả kiến trúc cho tính năng **Auto-workflow AI Search + Recommendations**, sử dụng mô hình C4 (từ Mức 1 đến Mức 3). 

Tính năng này cho phép người dùng tìm kiếm địa điểm, nhận gợi ý và tương tác bằng ngôn ngữ tự nhiên thông qua một luồng tự động (Agentic Orchestration) bao gồm: phân tích ý định (Router), thực thi công cụ (Workflow Engine / Tools), và tổng hợp câu trả lời (Composer).

---

## 1. Mức 1: Bối cảnh hệ thống (System Context)

Mức này mô tả cách người dùng tương tác với hệ thống và các dịch vụ bên ngoài (External Systems) mà tính năng này phụ thuộc.

```mermaid
C4Context
    title C4 Level 1: System Context - AI Travel Assistant

    Person(user, "User", "Searches for accommodations using natural language")

    System(coreSystem, "AI Travel Assistant", "Provides AI-powered accommodation search and recommendation services")

    System_Ext(groq, "Groq API (LLM)", "Provides natural language understanding and response generation")

    System_Ext(maps, "Map APIs", "Provides geocoding and location data services")

    Rel(user, coreSystem, "Search accommodations", "HTTPS")

    Rel(coreSystem, groq, "Analyze user queries and generate responses", "REST API")

    Rel(coreSystem, maps, "Retrieve geocoding and map data", "REST API")
```

---

## 2. Mức 2: Khối chứa (Container Diagram)

Mức này chỉ ra các khối thực thi (Containers) bên trong hệ thống tham gia vào luồng của tính năng này.

```mermaid
C4Container
    title C4 Level 2: Container Diagram - AI Travel Assistant

    Person(user, "User", "Searches for accommodations using natural language")

    System_Boundary(system, "AI Travel Assistant") {

        Container(frontend, "Web Frontend", "React, Vite", "Provides chat and map interfaces for accommodation search")

        Container(backend, "Backend API", "NestJS", "Handles chat requests, orchestrates AI workflows, performs place search, and generates recommendations")

        ContainerDb(db, "Database", "PostgreSQL, pgvector", "Stores places, metadata, and vector embeddings")
    }

    System_Ext(llm, "External LLM Service", "Provides natural language understanding and response generation")

    System_Ext(maps, "Map APIs", "Provides geocoding and map data services")

    Rel(user, frontend, "Search accommodations", "HTTPS")

    Rel(frontend, backend, "Send chat requests and receive responses", "JSON / SSE")

    Rel(backend, llm, "Analyze user queries and generate responses", "HTTPS")

    Rel(backend, maps, "Retrieve geocoding and location data", "HTTPS")

    Rel(backend, db, "Query and store accommodation data", "Prisma / SQL")
```

---

## 3. Mức 3: Thành phần (Component Diagram)

Mức này phóng to vào `AI Module` để hiển thị chi tiết các thành phần (Classes/Services) cấu thành nên cơ chế Orchestration. Đây là cốt lõi của luồng Auto-workflow.

```mermaid
C4Component
    title C4 Level 3: Component Diagram - AI Orchestration Module

    Container_Boundary(aiModule, "AI Orchestration Module") {

        Component(aiController, "AiController", "NestJS Controller", "Receives chat requests and forwards them to the orchestration layer")

        Component(orchestrator, "AiOrchestratorService", "NestJS Service", "Coordinates workflow execution, tool invocation, and response composition")

        Component(taskRouter, "GroqTaskRouterService", "NestJS Service", "Uses the LLM to analyze user intent, extract structured parameters, and determine workflow type")

        Component(workflowEngine, "WorkflowEngineService", "NestJS Service", "Executes workflow steps sequentially using registered tools")

        Component(registry, "Workflow Registry", "Configuration", "Defines workflow structures and execution steps")

        Component(composer, "GroqResponseComposerService", "NestJS Service", "Transforms structured results into natural language responses using the LLM")

        Component(convStore, "ConversationStoreService", "NestJS Service", "Stores and retrieves conversation history")
    }

    Container_Boundary(tools, "Internal Tools and Modules") {

        Component(toolSearch, "Hybrid Search Tool", "Search Module", "Retrieves places using hybrid keyword and vector search")

        Component(toolGeocode, "Geocode Tool", "Common Module", "Retrieves coordinates and location metadata")

        Component(toolRecommend, "Recommendation Tool", "Recommendation Module", "Ranks and filters accommodation results")
    }

    System_Ext(groq, "External LLM Service", "Provides semantic analysis and natural language generation")

    Rel(aiController, orchestrator, "Forward chat requests")

    Rel(orchestrator, convStore, "Store and retrieve conversation history")

    Rel(orchestrator, taskRouter, "Analyze user intent")

    Rel(taskRouter, groq, "Extract structured parameters and workflow type", "HTTPS")

    Rel(orchestrator, registry, "Load workflow definitions")

    Rel(orchestrator, workflowEngine, "Execute workflow")

    Rel(workflowEngine, toolSearch, "Execute place search")

    Rel(workflowEngine, toolGeocode, "Retrieve geocoding data")

    Rel(workflowEngine, toolRecommend, "Generate ranked recommendations")

    Rel(orchestrator, composer, "Compose final response")

    Rel(composer, groq, "Generate natural language response", "HTTPS")
```

---

## 4. Luồng thực thi chi tiết (Execution Flow)

Luồng hoạt động tuân theo mô hình **Agentic Orchestration (Router - Tool Execution - Composer)**:

1. **Nhận request (Controller):** User gửi câu hỏi (VD: *"Tìm khách sạn rẻ gần sân bay Nội Bài"*).
2. **Phân tích ý định (Router):** `GroqTaskRouterService` dùng LLM để trích xuất intent thành JSON (`query="khách sạn"`, `location="Hà Nội"`, `anchor="sân bay Nội Bài"`, `budget="low"`) và quyết định chạy `WORKFLOW_REGISTRY["SEARCH_PLACES"]`.
3. **Thực thi công cụ (Engine):** `WorkflowEngineService` chạy tuần tự các công cụ (không gọi LLM ở bước này để tăng tốc độ và tính ổn định):
   - `hybrid_search`: Lấy danh sách khách sạn tại Hà Nội.
   - `geocode_anchor`: Lấy tọa độ của "sân bay Nội Bài".
   - `recommend_places`: Chấm điểm (scoring) và sắp xếp (ranking) lại danh sách khách sạn dựa trên khoảng cách tới sân bay và ngân sách.
4. **Tổng hợp phản hồi (Composer):** `GroqResponseComposerService` gom dữ liệu kết quả từ các Tools, đưa cho LLM để sinh ra câu trả lời tự nhiên cho người dùng. Frontend sẽ nhận được cả text trả lời và dữ liệu cấu trúc (JSON) để render lên giao diện (Map/Cards).

---

## 5. Sơ đồ luồng tìm kiếm tự động (Automated Search Workflow)

Sơ đồ trình tự (Sequence Diagram) dưới đây mô tả luồng thực thi chi tiết khi hệ thống thực hiện tìm kiếm tự động (Automated Search Workflow) dựa trên các tham số đầu vào. Luồng này thực hiện tìm kiếm đồng thời từ Database và các External Providers, kết hợp loại bỏ trùng lặp và áp dụng Recommendation.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Controller as SearchController
    participant SearchSvc as SearchService
    participant PlacesSvc as PlacesService (DB)
    participant ExtProviders as External Providers<br/>(OSM, SerpAPI)
    participant GoongSvc as GoongPlacesService
    participant RecSvc as RecommendationsService

    Client->>Controller: GET /search (q, type, location, budget, ...)
    Controller->>SearchSvc: search(filters)
    
    SearchSvc->>SearchSvc: Normalize filters (budget, query string)
    
    par Concurrent Search
        SearchSvc->>PlacesSvc: findAll(type, city, q)
        PlacesSvc-->>SearchSvc: dbPlaces (Local Results)
    and
        SearchSvc->>ExtProviders: providers.map(p => p.searchAccommodations(...))
        ExtProviders-->>SearchSvc: resultsArray (External Results)
    end
    
    SearchSvc->>SearchSvc: Process & mergeAndPrioritizeLocal<br/>(Deduplicate, prioritize Local Results)
    
    opt applyRecommendations == true
        opt if location is provided
            SearchSvc->>GoongSvc: searchAccommodations({ query: location })
            GoongSvc-->>SearchSvc: geoResults (Extract anchorLocation)
        end
        SearchSvc->>RecSvc: rankPlaces(finalResults, { budget, anchorLocation, ... })
        RecSvc-->>SearchSvc: ranked.items (Sorted & Scored Results)
    end
    
    SearchSvc->>SearchSvc: Filter by accommodation keywords<br/>(hotel, resort, homestay, etc.)
    
    SearchSvc-->>Controller: finalResults (PlaceResult[])
    Controller-->>Client: 200 OK
```
