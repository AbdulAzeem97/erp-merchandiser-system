--
-- PostgreSQL database dump
--

\restrict pabxhFSHECJ1pN5X7m6ejiTib931GzoftRpzHKS2ohLxXTz9CoROsTp90odU3Wt

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: erp_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO erp_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: erp_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: InventoryLogType; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."InventoryLogType" AS ENUM (
    'IN',
    'OUT',
    'ADJUSTMENT',
    'DAMAGE',
    'RETURN'
);


ALTER TYPE public."InventoryLogType" OWNER TO erp_user;

--
-- Name: JobStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."JobStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
    'SUBMITTED_TO_QA',
    'APPROVED_BY_QA',
    'REVISIONS_REQUIRED'
);


ALTER TYPE public."JobStatus" OWNER TO erp_user;

--
-- Name: JobUrgency; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."JobUrgency" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."JobUrgency" OWNER TO erp_user;

--
-- Name: StepStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."StepStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'SKIPPED',
    'FAILED'
);


ALTER TYPE public."StepStatus" OWNER TO erp_user;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'MANAGER',
    'PRODUCTION_HEAD',
    'OPERATOR',
    'USER',
    'DESIGNER',
    'HOD_PREPRESS',
    'HEAD_OF_MERCHANDISER',
    'HEAD_OF_PRODUCTION',
    'MERCHANDISER',
    'QA',
    'QA_PREPRESS',
    'CTP_OPERATOR',
    'INVENTORY_MANAGER',
    'PROCUREMENT_MANAGER'
);


ALTER TYPE public."UserRole" OWNER TO erp_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    "userId" integer,
    action text NOT NULL,
    "tableName" text,
    "recordId" integer,
    "oldData" jsonb,
    "newData" jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO erp_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO erp_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO erp_user;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO erp_user;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    email text,
    website text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.companies OWNER TO erp_user;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO erp_user;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: goods_receipt_notes; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.goods_receipt_notes (
    grn_id integer NOT NULL,
    grn_number character varying(50) NOT NULL,
    po_id integer,
    supplier_id integer,
    grn_date date NOT NULL,
    received_by character varying(100) NOT NULL,
    location_id integer,
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    total_items integer DEFAULT 0,
    total_quantity numeric(12,2) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT goods_receipt_notes_status_check CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('RECEIVED'::character varying)::text, ('INSPECTED'::character varying)::text, ('ACCEPTED'::character varying)::text, ('REJECTED'::character varying)::text])))
);


ALTER TABLE public.goods_receipt_notes OWNER TO erp_user;

--
-- Name: goods_receipt_notes_grn_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.goods_receipt_notes_grn_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_receipt_notes_grn_id_seq OWNER TO erp_user;

--
-- Name: goods_receipt_notes_grn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.goods_receipt_notes_grn_id_seq OWNED BY public.goods_receipt_notes.grn_id;


--
-- Name: grn_items; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.grn_items (
    grn_item_id integer NOT NULL,
    grn_id integer,
    po_item_id integer,
    item_id integer,
    quantity_received numeric(12,2) NOT NULL,
    quantity_accepted numeric(12,2) DEFAULT 0,
    quantity_rejected numeric(12,2) DEFAULT 0,
    unit character varying(10) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(15,2) NOT NULL,
    batch_number character varying(100),
    expiry_date date,
    quality_status character varying(20) DEFAULT 'PENDING'::character varying,
    inspection_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT grn_items_quality_status_check CHECK (((quality_status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('ACCEPTED'::character varying)::text, ('REJECTED'::character varying)::text, ('CONDITIONAL'::character varying)::text])))
);


ALTER TABLE public.grn_items OWNER TO erp_user;

--
-- Name: grn_items_grn_item_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.grn_items_grn_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grn_items_grn_item_id_seq OWNER TO erp_user;

--
-- Name: grn_items_grn_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.grn_items_grn_item_id_seq OWNED BY public.grn_items.grn_item_id;


--
-- Name: inventory_balances; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.inventory_balances (
    balance_id integer NOT NULL,
    item_id integer,
    location_id integer,
    opening_qty numeric(12,2) DEFAULT 0,
    in_qty numeric(12,2) DEFAULT 0,
    out_qty numeric(12,2) DEFAULT 0,
    adjustment_qty numeric(12,2) DEFAULT 0,
    balance_qty numeric(12,2) DEFAULT 0,
    unit_cost numeric(12,2) DEFAULT 0,
    total_value numeric(15,2) DEFAULT 0,
    last_txn_date date,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_balances OWNER TO erp_user;

--
-- Name: inventory_balances_balance_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.inventory_balances_balance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_balances_balance_id_seq OWNER TO erp_user;

--
-- Name: inventory_balances_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.inventory_balances_balance_id_seq OWNED BY public.inventory_balances.balance_id;


--
-- Name: inventory_categories; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.inventory_categories (
    category_id integer NOT NULL,
    department character varying(100) NOT NULL,
    master_category character varying(100) NOT NULL,
    control_category character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_categories OWNER TO erp_user;

--
-- Name: inventory_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.inventory_categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_categories_category_id_seq OWNER TO erp_user;

--
-- Name: inventory_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.inventory_categories_category_id_seq OWNED BY public.inventory_categories.category_id;


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.inventory_items (
    item_id integer NOT NULL,
    item_code character varying(50) NOT NULL,
    item_name character varying(255) NOT NULL,
    unit character varying(10) NOT NULL,
    category_id integer,
    reorder_level numeric(12,2) DEFAULT 0,
    reorder_qty numeric(12,2) DEFAULT 0,
    unit_cost numeric(12,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_items OWNER TO erp_user;

--
-- Name: inventory_items_item_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.inventory_items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_items_item_id_seq OWNER TO erp_user;

--
-- Name: inventory_items_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.inventory_items_item_id_seq OWNED BY public.inventory_items.item_id;


--
-- Name: inventory_locations; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.inventory_locations (
    location_id integer NOT NULL,
    location_name character varying(100) NOT NULL,
    location_code character varying(20),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_locations OWNER TO erp_user;

--
-- Name: inventory_locations_location_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.inventory_locations_location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_locations_location_id_seq OWNER TO erp_user;

--
-- Name: inventory_locations_location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.inventory_locations_location_id_seq OWNED BY public.inventory_locations.location_id;


--
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.inventory_logs (
    id integer NOT NULL,
    "itemId" integer NOT NULL,
    type public."InventoryLogType" NOT NULL,
    quantity integer NOT NULL,
    "previousQty" integer NOT NULL,
    "newQty" integer NOT NULL,
    notes text,
    "userId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.inventory_logs OWNER TO erp_user;

--
-- Name: inventory_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.inventory_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_logs_id_seq OWNER TO erp_user;

--
-- Name: inventory_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.inventory_logs_id_seq OWNED BY public.inventory_logs.id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.inventory_transactions (
    txn_id integer NOT NULL,
    item_id integer,
    location_id integer,
    txn_type character varying(20) NOT NULL,
    txn_date date NOT NULL,
    qty numeric(12,2) NOT NULL,
    unit character varying(10) NOT NULL,
    ref_no character varying(100),
    department character varying(100),
    job_card_no character varying(100),
    remarks text,
    unit_cost numeric(12,2) DEFAULT 0,
    total_value numeric(15,2) DEFAULT 0,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT inventory_transactions_txn_type_check CHECK (((txn_type)::text = ANY (ARRAY[('IN'::character varying)::text, ('OUT'::character varying)::text, ('ADJUSTMENT'::character varying)::text, ('TRANSFER'::character varying)::text, ('OPENING_BALANCE'::character varying)::text])))
);


ALTER TABLE public.inventory_transactions OWNER TO erp_user;

--
-- Name: inventory_transactions_txn_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.inventory_transactions_txn_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_txn_id_seq OWNER TO erp_user;

--
-- Name: inventory_transactions_txn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.inventory_transactions_txn_id_seq OWNED BY public.inventory_transactions.txn_id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.invoices (
    invoice_id integer NOT NULL,
    invoice_number character varying(100) NOT NULL,
    supplier_id integer,
    po_id integer,
    grn_id integer,
    invoice_date date NOT NULL,
    due_date date,
    subtotal numeric(15,2) NOT NULL,
    tax_amount numeric(15,2) DEFAULT 0,
    discount_amount numeric(15,2) DEFAULT 0,
    total_amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    payment_terms character varying(100),
    payment_method character varying(50),
    paid_date date,
    paid_amount numeric(15,2) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('VERIFIED'::character varying)::text, ('APPROVED'::character varying)::text, ('PAID'::character varying)::text, ('DISPUTED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE public.invoices OWNER TO erp_user;

--
-- Name: invoices_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.invoices_invoice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_invoice_id_seq OWNER TO erp_user;

--
-- Name: invoices_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.invoices_invoice_id_seq OWNED BY public.invoices.invoice_id;


--
-- Name: item_specifications; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.item_specifications (
    id integer NOT NULL,
    job_card_id integer,
    excel_file_link text NOT NULL,
    excel_file_name text,
    po_number text,
    job_number text,
    brand_name text,
    item_name text,
    uploaded_at timestamp without time zone DEFAULT now(),
    item_count integer DEFAULT 0,
    total_quantity integer DEFAULT 0,
    size_variants integer DEFAULT 0,
    color_variants integer DEFAULT 0,
    specifications jsonb,
    raw_excel_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.item_specifications OWNER TO erp_user;

--
-- Name: TABLE item_specifications; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON TABLE public.item_specifications IS 'Stores item specifications data uploaded via Excel files for all jobs';


--
-- Name: COLUMN item_specifications.excel_file_link; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.item_specifications.excel_file_link IS 'Google Drive link to the uploaded Excel file';


--
-- Name: COLUMN item_specifications.specifications; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.item_specifications.specifications IS 'Parsed specifications data (sizes, colors, materials, etc.)';


--
-- Name: COLUMN item_specifications.raw_excel_data; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.item_specifications.raw_excel_data IS 'Complete raw data from Excel file for reference';


--
-- Name: item_specifications_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.item_specifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.item_specifications_id_seq OWNER TO erp_user;

--
-- Name: item_specifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.item_specifications_id_seq OWNED BY public.item_specifications.id;


--
-- Name: job_attachments; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.job_attachments (
    id integer NOT NULL,
    job_card_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    file_type character varying(100),
    uploaded_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.job_attachments OWNER TO erp_user;

--
-- Name: job_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.job_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_attachments_id_seq OWNER TO erp_user;

--
-- Name: job_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.job_attachments_id_seq OWNED BY public.job_attachments.id;


--
-- Name: job_cards; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.job_cards (
    id integer NOT NULL,
    "jobNumber" text NOT NULL,
    "companyId" integer NOT NULL,
    "productId" integer NOT NULL,
    "sequenceId" integer NOT NULL,
    quantity integer NOT NULL,
    urgency public."JobUrgency" DEFAULT 'NORMAL'::public."JobUrgency" NOT NULL,
    status public."JobStatus" DEFAULT 'PENDING'::public."JobStatus" NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "totalCost" numeric(65,30) DEFAULT 0 NOT NULL,
    notes text,
    "createdById" integer NOT NULL,
    "assignedToId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    po_number character varying(100),
    customer_name character varying(255),
    customer_email character varying(255),
    customer_phone character varying(50),
    customer_address text,
    client_layout_link text,
    final_design_link text,
    qa_notes text,
    qa_approved_by integer,
    qa_approved_at timestamp with time zone
);


ALTER TABLE public.job_cards OWNER TO erp_user;

--
-- Name: job_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.job_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_cards_id_seq OWNER TO erp_user;

--
-- Name: job_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.job_cards_id_seq OWNED BY public.job_cards.id;


--
-- Name: job_lifecycles; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.job_lifecycles (
    id integer NOT NULL,
    "jobCardId" integer NOT NULL,
    "processStepId" integer NOT NULL,
    status public."StepStatus" DEFAULT 'PENDING'::public."StepStatus" NOT NULL,
    "startTime" timestamp(3) without time zone,
    "endTime" timestamp(3) without time zone,
    duration integer,
    "qualityCheck" boolean,
    notes text,
    "userId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.job_lifecycles OWNER TO erp_user;

--
-- Name: job_lifecycles_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.job_lifecycles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_lifecycles_id_seq OWNER TO erp_user;

--
-- Name: job_lifecycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.job_lifecycles_id_seq OWNED BY public.job_lifecycles.id;


--
-- Name: job_process_selections; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.job_process_selections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "jobId" integer NOT NULL,
    "processStepId" integer NOT NULL,
    is_selected boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.job_process_selections OWNER TO erp_user;

--
-- Name: materials; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.materials (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    unit text DEFAULT 'pcs'::text NOT NULL,
    "costPerUnit" numeric(65,30) DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.materials OWNER TO erp_user;

--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.materials_id_seq OWNER TO erp_user;

--
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


--
-- Name: prepress_activity; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.prepress_activity (
    id integer NOT NULL,
    prepress_job_id integer NOT NULL,
    actor_id integer,
    action text NOT NULL,
    from_status text,
    to_status text,
    remark text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT prepress_activity_action_check CHECK ((action = ANY (ARRAY['ASSIGNED'::text, 'STARTED'::text, 'PAUSED'::text, 'RESUMED'::text, 'COMPLETED'::text, 'REJECTED'::text, 'REASSIGNED'::text, 'REMARK'::text, 'STATUS_CHANGED'::text, 'SUBMITTED_TO_QA'::text, 'APPROVED_BY_QA'::text, 'REVISIONS_REQUIRED'::text])))
);


ALTER TABLE public.prepress_activity OWNER TO erp_user;

--
-- Name: prepress_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.prepress_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prepress_activity_id_seq OWNER TO erp_user;

--
-- Name: prepress_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.prepress_activity_id_seq OWNED BY public.prepress_activity.id;


--
-- Name: prepress_jobs; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.prepress_jobs (
    id integer NOT NULL,
    job_card_id integer NOT NULL,
    assigned_designer_id integer,
    status text DEFAULT 'PENDING'::text NOT NULL,
    priority text DEFAULT 'MEDIUM'::text NOT NULL,
    due_date timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    hod_last_remark text,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    plate_generated boolean DEFAULT false,
    plate_generated_at timestamp without time zone,
    plate_generated_by integer,
    plate_count integer DEFAULT 0,
    ctp_notes text,
    plate_tag_printed boolean DEFAULT false,
    plate_tag_printed_at timestamp without time zone,
    CONSTRAINT prepress_jobs_priority_check CHECK ((priority = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'CRITICAL'::text]))),
    CONSTRAINT prepress_jobs_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'ASSIGNED'::text, 'IN_PROGRESS'::text, 'PAUSED'::text, 'HOD_REVIEW'::text, 'SUBMITTED_TO_QA'::text, 'APPROVED_BY_QA'::text, 'REVISIONS_REQUIRED'::text, 'COMPLETED'::text, 'REJECTED'::text])))
);


ALTER TABLE public.prepress_jobs OWNER TO erp_user;

--
-- Name: COLUMN prepress_jobs.plate_generated; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.prepress_jobs.plate_generated IS 'Whether plates have been generated for this job';


--
-- Name: COLUMN prepress_jobs.plate_generated_at; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.prepress_jobs.plate_generated_at IS 'Timestamp when plates were generated';


--
-- Name: COLUMN prepress_jobs.plate_generated_by; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.prepress_jobs.plate_generated_by IS 'CTP operator who generated the plates';


--
-- Name: COLUMN prepress_jobs.plate_count; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.prepress_jobs.plate_count IS 'Number of plates generated for this job';


--
-- Name: COLUMN prepress_jobs.ctp_notes; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.prepress_jobs.ctp_notes IS 'Notes from CTP department';


--
-- Name: COLUMN prepress_jobs.plate_tag_printed; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.prepress_jobs.plate_tag_printed IS 'Whether plate tags have been printed';


--
-- Name: COLUMN prepress_jobs.plate_tag_printed_at; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.prepress_jobs.plate_tag_printed_at IS 'Timestamp when plate tags were printed';


--
-- Name: prepress_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.prepress_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prepress_jobs_id_seq OWNER TO erp_user;

--
-- Name: prepress_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.prepress_jobs_id_seq OWNED BY public.prepress_jobs.id;


--
-- Name: process_sequences; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.process_sequences (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.process_sequences OWNER TO erp_user;

--
-- Name: process_sequences_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.process_sequences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.process_sequences_id_seq OWNER TO erp_user;

--
-- Name: process_sequences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.process_sequences_id_seq OWNED BY public.process_sequences.id;


--
-- Name: process_steps; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.process_steps (
    id integer NOT NULL,
    "sequenceId" integer NOT NULL,
    "stepNumber" integer NOT NULL,
    name text NOT NULL,
    description text,
    "estimatedDuration" integer,
    "isQualityCheck" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    process_sequence_id uuid
);


ALTER TABLE public.process_steps OWNER TO erp_user;

--
-- Name: process_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.process_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.process_steps_id_seq OWNER TO erp_user;

--
-- Name: process_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.process_steps_id_seq OWNED BY public.process_steps.id;


--
-- Name: procurement_report_config; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.procurement_report_config (
    config_id integer NOT NULL,
    report_name character varying(100) NOT NULL,
    report_type character varying(50) NOT NULL,
    config_data jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.procurement_report_config OWNER TO erp_user;

--
-- Name: procurement_report_config_config_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.procurement_report_config_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procurement_report_config_config_id_seq OWNER TO erp_user;

--
-- Name: procurement_report_config_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.procurement_report_config_config_id_seq OWNED BY public.procurement_report_config.config_id;


--
-- Name: product_process_selections; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.product_process_selections (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    "sequenceId" integer NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_process_selections OWNER TO erp_user;

--
-- Name: product_process_selections_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.product_process_selections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_process_selections_id_seq OWNER TO erp_user;

--
-- Name: product_process_selections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.product_process_selections_id_seq OWNED BY public.product_process_selections.id;


--
-- Name: product_step_selections; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.product_step_selections (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    "stepId" integer NOT NULL,
    is_selected boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_step_selections OWNER TO erp_user;

--
-- Name: product_step_selections_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.product_step_selections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_step_selections_id_seq OWNER TO erp_user;

--
-- Name: product_step_selections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.product_step_selections_id_seq OWNED BY public.product_step_selections.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    sku text NOT NULL,
    "categoryId" integer NOT NULL,
    brand text,
    gsm double precision,
    "fscCertified" boolean DEFAULT false NOT NULL,
    "fscLicense" text,
    "basePrice" numeric(65,30) DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    material_id integer
);


ALTER TABLE public.products OWNER TO erp_user;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO erp_user;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.purchase_order_items (
    po_item_id integer NOT NULL,
    po_id integer,
    item_id integer,
    quantity_ordered numeric(12,2) NOT NULL,
    quantity_received numeric(12,2) DEFAULT 0,
    unit character varying(10) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(15,2) NOT NULL,
    specifications text,
    expected_delivery_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.purchase_order_items OWNER TO erp_user;

--
-- Name: purchase_order_items_po_item_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.purchase_order_items_po_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_items_po_item_id_seq OWNER TO erp_user;

--
-- Name: purchase_order_items_po_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.purchase_order_items_po_item_id_seq OWNED BY public.purchase_order_items.po_item_id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.purchase_orders (
    po_id integer NOT NULL,
    po_number character varying(50) NOT NULL,
    supplier_id integer,
    requisition_id integer,
    po_date date NOT NULL,
    expected_delivery_date date,
    actual_delivery_date date,
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    subtotal numeric(15,2) DEFAULT 0,
    tax_amount numeric(15,2) DEFAULT 0,
    discount_amount numeric(15,2) DEFAULT 0,
    total_amount numeric(15,2) DEFAULT 0,
    currency character varying(10) DEFAULT 'USD'::character varying,
    payment_terms character varying(100),
    shipping_address text,
    billing_address text,
    notes text,
    created_by character varying(100),
    approved_by character varying(100),
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT purchase_orders_status_check CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('SENT'::character varying)::text, ('ACKNOWLEDGED'::character varying)::text, ('PARTIALLY_RECEIVED'::character varying)::text, ('RECEIVED'::character varying)::text, ('CANCELLED'::character varying)::text, ('CLOSED'::character varying)::text])))
);


ALTER TABLE public.purchase_orders OWNER TO erp_user;

--
-- Name: purchase_orders_po_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.purchase_orders_po_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_po_id_seq OWNER TO erp_user;

--
-- Name: purchase_orders_po_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.purchase_orders_po_id_seq OWNED BY public.purchase_orders.po_id;


--
-- Name: purchase_requisition_items; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.purchase_requisition_items (
    requisition_item_id integer NOT NULL,
    requisition_id integer,
    item_id integer,
    quantity numeric(12,2) NOT NULL,
    unit character varying(10) NOT NULL,
    estimated_unit_price numeric(12,2),
    estimated_total_price numeric(15,2),
    specifications text,
    required_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.purchase_requisition_items OWNER TO erp_user;

--
-- Name: purchase_requisition_items_requisition_item_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.purchase_requisition_items_requisition_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_requisition_items_requisition_item_id_seq OWNER TO erp_user;

--
-- Name: purchase_requisition_items_requisition_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.purchase_requisition_items_requisition_item_id_seq OWNED BY public.purchase_requisition_items.requisition_item_id;


--
-- Name: purchase_requisitions; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.purchase_requisitions (
    requisition_id integer NOT NULL,
    requisition_number character varying(50) NOT NULL,
    requested_by character varying(100) NOT NULL,
    department character varying(100) NOT NULL,
    requisition_date date NOT NULL,
    required_date date,
    priority character varying(20) DEFAULT 'NORMAL'::character varying,
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    total_estimated_cost numeric(15,2) DEFAULT 0,
    justification text,
    approved_by character varying(100),
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT purchase_requisitions_priority_check CHECK (((priority)::text = ANY (ARRAY[('LOW'::character varying)::text, ('NORMAL'::character varying)::text, ('HIGH'::character varying)::text, ('URGENT'::character varying)::text]))),
    CONSTRAINT purchase_requisitions_status_check CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('SUBMITTED'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE public.purchase_requisitions OWNER TO erp_user;

--
-- Name: purchase_requisitions_requisition_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.purchase_requisitions_requisition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_requisitions_requisition_id_seq OWNER TO erp_user;

--
-- Name: purchase_requisitions_requisition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.purchase_requisitions_requisition_id_seq OWNED BY public.purchase_requisitions.requisition_id;


--
-- Name: ratio_reports; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.ratio_reports (
    id integer NOT NULL,
    job_card_id integer,
    excel_file_link text,
    excel_file_name text,
    factory_name text,
    po_number text,
    job_number text,
    brand_name text,
    item_name text,
    report_date date,
    total_ups integer,
    total_sheets integer,
    total_plates integer,
    qty_produced integer,
    excess_qty integer,
    efficiency_percentage numeric(5,2),
    excess_percentage numeric(5,2),
    required_order_qty integer,
    color_details jsonb,
    plate_distribution jsonb,
    color_efficiency jsonb,
    raw_excel_data jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ratio_reports OWNER TO erp_user;

--
-- Name: TABLE ratio_reports; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON TABLE public.ratio_reports IS 'Stores production ratio analysis data from uploaded Excel files';


--
-- Name: COLUMN ratio_reports.job_card_id; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.job_card_id IS 'Reference to the job card';


--
-- Name: COLUMN ratio_reports.excel_file_link; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.excel_file_link IS 'Google Drive link to the uploaded Excel file';


--
-- Name: COLUMN ratio_reports.excel_file_name; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.excel_file_name IS 'Name of the uploaded Excel file';


--
-- Name: COLUMN ratio_reports.factory_name; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.factory_name IS 'Factory name from ratio report';


--
-- Name: COLUMN ratio_reports.total_ups; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.total_ups IS 'Total Units Per Sheet';


--
-- Name: COLUMN ratio_reports.total_sheets; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.total_sheets IS 'Total sheets required';


--
-- Name: COLUMN ratio_reports.total_plates; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.total_plates IS 'Total plates required';


--
-- Name: COLUMN ratio_reports.qty_produced; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.qty_produced IS 'Quantity to be produced';


--
-- Name: COLUMN ratio_reports.excess_qty; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.excess_qty IS 'Excess quantity (waste)';


--
-- Name: COLUMN ratio_reports.efficiency_percentage; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.efficiency_percentage IS 'Production efficiency percentage';


--
-- Name: COLUMN ratio_reports.excess_percentage; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.excess_percentage IS 'Excess/waste percentage';


--
-- Name: COLUMN ratio_reports.required_order_qty; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.required_order_qty IS 'Required order quantity';


--
-- Name: COLUMN ratio_reports.color_details; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.color_details IS 'Array of color-wise production details (JSON)';


--
-- Name: COLUMN ratio_reports.plate_distribution; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.plate_distribution IS 'Plate usage distribution data (JSON)';


--
-- Name: COLUMN ratio_reports.color_efficiency; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.color_efficiency IS 'Color-wise efficiency metrics (JSON)';


--
-- Name: COLUMN ratio_reports.raw_excel_data; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.raw_excel_data IS 'Complete raw data from Excel file (JSON)';


--
-- Name: COLUMN ratio_reports.created_by; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.ratio_reports.created_by IS 'User who uploaded the ratio report';


--
-- Name: ratio_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.ratio_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ratio_reports_id_seq OWNER TO erp_user;

--
-- Name: ratio_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.ratio_reports_id_seq OWNED BY public.ratio_reports.id;


--
-- Name: supplier_items; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.supplier_items (
    supplier_item_id integer NOT NULL,
    supplier_id integer,
    item_id integer,
    supplier_item_code character varying(100),
    supplier_item_name character varying(255),
    unit_price numeric(12,2) NOT NULL,
    minimum_order_qty numeric(12,2) DEFAULT 1,
    lead_time_days integer DEFAULT 0,
    is_preferred boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.supplier_items OWNER TO erp_user;

--
-- Name: supplier_items_supplier_item_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.supplier_items_supplier_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_items_supplier_item_id_seq OWNER TO erp_user;

--
-- Name: supplier_items_supplier_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.supplier_items_supplier_item_id_seq OWNED BY public.supplier_items.supplier_item_id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.suppliers (
    supplier_id integer NOT NULL,
    supplier_code character varying(50) NOT NULL,
    supplier_name character varying(255) NOT NULL,
    contact_person character varying(255),
    email character varying(255),
    phone character varying(50),
    address text,
    city character varying(100),
    state character varying(100),
    country character varying(100),
    postal_code character varying(20),
    tax_id character varying(100),
    payment_terms character varying(100),
    credit_limit numeric(15,2) DEFAULT 0,
    currency character varying(10) DEFAULT 'USD'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.suppliers OWNER TO erp_user;

--
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.suppliers_supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_supplier_id_seq OWNER TO erp_user;

--
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.suppliers_supplier_id_seq OWNED BY public.suppliers.supplier_id;


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.system_config (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_config OWNER TO erp_user;

--
-- Name: system_config_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.system_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_config_id_seq OWNER TO erp_user;

--
-- Name: system_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.system_config_id_seq OWNED BY public.system_config.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "firstName" text,
    "lastName" text,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO erp_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO erp_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: goods_receipt_notes grn_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_notes ALTER COLUMN grn_id SET DEFAULT nextval('public.goods_receipt_notes_grn_id_seq'::regclass);


--
-- Name: grn_items grn_item_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.grn_items ALTER COLUMN grn_item_id SET DEFAULT nextval('public.grn_items_grn_item_id_seq'::regclass);


--
-- Name: inventory_balances balance_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_balances ALTER COLUMN balance_id SET DEFAULT nextval('public.inventory_balances_balance_id_seq'::regclass);


--
-- Name: inventory_categories category_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_categories ALTER COLUMN category_id SET DEFAULT nextval('public.inventory_categories_category_id_seq'::regclass);


--
-- Name: inventory_items item_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_items ALTER COLUMN item_id SET DEFAULT nextval('public.inventory_items_item_id_seq'::regclass);


--
-- Name: inventory_locations location_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_locations ALTER COLUMN location_id SET DEFAULT nextval('public.inventory_locations_location_id_seq'::regclass);


--
-- Name: inventory_logs id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_logs ALTER COLUMN id SET DEFAULT nextval('public.inventory_logs_id_seq'::regclass);


--
-- Name: inventory_transactions txn_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN txn_id SET DEFAULT nextval('public.inventory_transactions_txn_id_seq'::regclass);


--
-- Name: invoices invoice_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoices ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoices_invoice_id_seq'::regclass);


--
-- Name: item_specifications id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.item_specifications ALTER COLUMN id SET DEFAULT nextval('public.item_specifications_id_seq'::regclass);


--
-- Name: job_attachments id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_attachments ALTER COLUMN id SET DEFAULT nextval('public.job_attachments_id_seq'::regclass);


--
-- Name: job_cards id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_cards ALTER COLUMN id SET DEFAULT nextval('public.job_cards_id_seq'::regclass);


--
-- Name: job_lifecycles id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_lifecycles ALTER COLUMN id SET DEFAULT nextval('public.job_lifecycles_id_seq'::regclass);


--
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


--
-- Name: prepress_activity id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_activity ALTER COLUMN id SET DEFAULT nextval('public.prepress_activity_id_seq'::regclass);


--
-- Name: prepress_jobs id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_jobs ALTER COLUMN id SET DEFAULT nextval('public.prepress_jobs_id_seq'::regclass);


--
-- Name: process_sequences id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.process_sequences ALTER COLUMN id SET DEFAULT nextval('public.process_sequences_id_seq'::regclass);


--
-- Name: process_steps id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.process_steps ALTER COLUMN id SET DEFAULT nextval('public.process_steps_id_seq'::regclass);


--
-- Name: procurement_report_config config_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.procurement_report_config ALTER COLUMN config_id SET DEFAULT nextval('public.procurement_report_config_config_id_seq'::regclass);


--
-- Name: product_process_selections id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product_process_selections ALTER COLUMN id SET DEFAULT nextval('public.product_process_selections_id_seq'::regclass);


--
-- Name: product_step_selections id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product_step_selections ALTER COLUMN id SET DEFAULT nextval('public.product_step_selections_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: purchase_order_items po_item_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN po_item_id SET DEFAULT nextval('public.purchase_order_items_po_item_id_seq'::regclass);


--
-- Name: purchase_orders po_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN po_id SET DEFAULT nextval('public.purchase_orders_po_id_seq'::regclass);


--
-- Name: purchase_requisition_items requisition_item_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition_items ALTER COLUMN requisition_item_id SET DEFAULT nextval('public.purchase_requisition_items_requisition_item_id_seq'::regclass);


--
-- Name: purchase_requisitions requisition_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisitions ALTER COLUMN requisition_id SET DEFAULT nextval('public.purchase_requisitions_requisition_id_seq'::regclass);


--
-- Name: ratio_reports id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.ratio_reports ALTER COLUMN id SET DEFAULT nextval('public.ratio_reports_id_seq'::regclass);


--
-- Name: supplier_items supplier_item_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.supplier_items ALTER COLUMN supplier_item_id SET DEFAULT nextval('public.supplier_items_supplier_item_id_seq'::regclass);


--
-- Name: suppliers supplier_id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN supplier_id SET DEFAULT nextval('public.suppliers_supplier_id_seq'::regclass);


--
-- Name: system_config id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.system_config ALTER COLUMN id SET DEFAULT nextval('public.system_config_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.audit_logs (id, "userId", action, "tableName", "recordId", "oldData", "newData", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.categories (id, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
1	Packaging	Packaging materials and boxes	t	2025-09-14 10:17:06.555	2025-09-14 10:17:06.555
2	Printing	Printed materials and documents	t	2025-09-14 10:17:06.555	2025-09-14 10:17:06.555
3	Labels	Product labels and stickers	t	2025-09-14 10:17:06.555	2025-09-14 10:17:06.555
4	Books	Books and publications	t	2025-09-14 10:17:06.557	2025-09-14 10:17:06.557
5	Hang Tags	Product identification tags	t	2025-09-14 10:24:15.074	2025-09-14 10:24:15.074
6	Care Labels	Care instruction labels	t	2025-09-14 10:24:15.086	2025-09-14 10:24:15.086
7	Price Tags	Pricing information tags	t	2025-09-14 10:24:15.076	2025-09-14 10:24:15.076
8	Brand Labels	Brand identification labels	t	2025-09-14 10:24:15.089	2025-09-14 10:24:15.089
9	Size Labels	Size specification labels	t	2025-09-14 10:24:15.088	2025-09-14 10:24:15.088
10	Woven Labels	Woven fabric labels	t	2025-09-14 10:24:15.089	2025-09-14 10:24:15.089
11	Leather Patches	Leather patch labels	t	2025-09-14 10:24:15.09	2025-09-14 10:24:15.09
12	Heat Transfer Labels	Heat transfer vinyl labels	t	2025-09-14 10:24:15.089	2025-09-14 10:24:15.089
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.companies (id, name, address, phone, email, website, "isActive", "createdAt", "updatedAt") FROM stdin;
1	ABC Manufacturing Ltd	123 Industrial St, City, State 12345	+1234567000	orders@abc-mfg.com	https://abc-mfg.com	t	2025-09-14 10:17:07.303	2025-09-14 10:17:07.303
2	XYZ Retail Corp	456 Business Ave, City, State 67890	+1234567001	procurement@xyz-retail.com	https://xyz-retail.com	t	2025-09-14 10:17:07.303	2025-09-14 10:17:07.303
3	Nike Inc.	123 Nike St, Oregon, USA	+1-555-0123	orders@nike.com	https://nike.com	t	2025-09-14 10:24:16.094	2025-09-14 10:24:16.094
4	Adidas AG	456 Adidas Ave, Germany	+49-555-0456	procurement@adidas.com	https://adidas.com	t	2025-09-14 10:24:16.096	2025-09-14 10:24:16.096
5	Puma SE	789 Puma Rd, Germany	+49-555-0789	orders@puma.com	https://puma.com	t	2025-09-14 10:24:16.101	2025-09-14 10:24:16.101
6	Under Armour Inc.	321 UA Blvd, Maryland, USA	+1-555-0321	procurement@underarmour.com	https://underarmour.com	t	2025-09-14 10:24:16.107	2025-09-14 10:24:16.107
7	H&M Hennes & Mauritz	654 Fashion St, Stockholm, Sweden	+46-555-0654	orders@hm.com	https://hm.com	t	2025-09-14 10:24:16.109	2025-09-14 10:24:16.109
\.


--
-- Data for Name: goods_receipt_notes; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.goods_receipt_notes (grn_id, grn_number, po_id, supplier_id, grn_date, received_by, location_id, status, total_items, total_quantity, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: grn_items; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.grn_items (grn_item_id, grn_id, po_item_id, item_id, quantity_received, quantity_accepted, quantity_rejected, unit, unit_price, total_price, batch_number, expiry_date, quality_status, inspection_notes, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_balances; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.inventory_balances (balance_id, item_id, location_id, opening_qty, in_qty, out_qty, adjustment_qty, balance_qty, unit_cost, total_value, last_txn_date, last_updated) FROM stdin;
\.


--
-- Data for Name: inventory_categories; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.inventory_categories (category_id, department, master_category, control_category, description, is_active, created_at, updated_at) FROM stdin;
1	Printing	Printing	Flexo Ink	Flexographic printing inks	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
2	Printing	Printing	Screen Ink	Screen printing inks	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
3	Printing	Printing	Offset Ink	Offset printing inks	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
4	Printing	Printing	Digital Ink	Digital printing inks	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
5	Production	Packing Material	Boxes	Various types of boxes	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
6	Production	Packing Material	Bags	Various types of bags	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
7	Production	Packing Material	Labels	Product labels and stickers	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
8	CTP	CTP Materials	Plates	Printing plates	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
9	CTP	CTP Materials	Chemicals	CTP processing chemicals	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
10	Production	Raw Materials	Paper	Various paper types	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
11	Production	Raw Materials	Board	Cardboard and board materials	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.inventory_items (item_id, item_code, item_name, unit, category_id, reorder_level, reorder_qty, unit_cost, is_active, created_at, updated_at) FROM stdin;
44	INK-FLX-RED-001	Flexo Ink - Red (Pantone 186C)	LTR	1	5.00	20.00	45.50	t	2025-10-06 08:27:15.875595	2025-10-06 08:27:15.875595
45	INK-FLX-BLUE-002	Flexo Ink - Blue (Pantone 286C)	LTR	1	5.00	20.00	48.75	t	2025-10-06 08:27:15.88217	2025-10-06 08:27:15.88217
46	INK-FLX-BLACK-003	Flexo Ink - Black (Process Black)	LTR	1	8.00	25.00	42.00	t	2025-10-06 08:27:15.886143	2025-10-06 08:27:15.886143
47	INK-SCR-YELLOW-004	Screen Ink - Yellow (Pantone 116C)	LTR	2	3.00	15.00	52.25	t	2025-10-06 08:27:15.888817	2025-10-06 08:27:15.888817
48	INK-OFF-CYAN-005	Offset Ink - Cyan (Process Cyan)	LTR	3	4.00	18.00	55.80	t	2025-10-06 08:27:15.89237	2025-10-06 08:27:15.89237
49	INK-DIG-MAGENTA-006	Digital Ink - Magenta (Process Magenta)	LTR	4	2.00	12.00	68.90	t	2025-10-06 08:27:15.895243	2025-10-06 08:27:15.895243
50	BOX-CORR-001	Corrugated Box - Small (12x8x6 inches)	PCS	5	100.00	500.00	2.50	t	2025-10-06 08:27:15.898035	2025-10-06 08:27:15.898035
51	BOX-CORR-002	Corrugated Box - Medium (18x12x10 inches)	PCS	5	80.00	400.00	4.25	t	2025-10-06 08:27:15.908462	2025-10-06 08:27:15.908462
52	BOX-CORR-003	Corrugated Box - Large (24x18x12 inches)	PCS	5	60.00	300.00	6.75	t	2025-10-06 08:27:15.915405	2025-10-06 08:27:15.915405
53	BAG-POLY-001	Polyethylene Bag - Small (8x12 inches)	PCS	6	500.00	2000.00	0.15	t	2025-10-06 08:27:15.985946	2025-10-06 08:27:15.985946
54	BAG-PAPER-002	Paper Bag - Medium (10x15 inches)	PCS	6	300.00	1500.00	0.35	t	2025-10-06 08:27:15.999411	2025-10-06 08:27:15.999411
55	LABEL-GLOSS-001	Glossy Label - 2x4 inches	PCS	7	1000.00	5000.00	0.08	t	2025-10-06 08:27:16.00622	2025-10-06 08:27:16.00622
56	LABEL-MATT-002	Matte Label - 3x5 inches	PCS	7	800.00	4000.00	0.12	t	2025-10-06 08:27:16.010183	2025-10-06 08:27:16.010183
57	PLATE-CTP-001	CTP Plate - 8x10 inches	PCS	8	50.00	200.00	12.50	t	2025-10-06 08:27:16.014268	2025-10-06 08:27:16.014268
58	PLATE-CTP-002	CTP Plate - 11x17 inches	PCS	8	40.00	150.00	18.75	t	2025-10-06 08:27:16.020048	2025-10-06 08:27:16.020048
59	CHEM-DEV-001	CTP Developer Solution	LTR	9	10.00	50.00	25.00	t	2025-10-06 08:27:16.034564	2025-10-06 08:27:16.034564
60	CHEM-FIN-002	CTP Finisher Solution	LTR	9	8.00	40.00	22.50	t	2025-10-06 08:27:16.112243	2025-10-06 08:27:16.112243
61	PAPER-A4-001	A4 Paper - 80 GSM White	REAMS	10	20.00	100.00	8.50	t	2025-10-06 08:27:16.12857	2025-10-06 08:27:16.12857
62	PAPER-A3-002	A3 Paper - 100 GSM White	REAMS	10	15.00	75.00	12.25	t	2025-10-06 08:27:16.134215	2025-10-06 08:27:16.134215
63	BOARD-300GSM-001	Cardboard - 300 GSM White	SHEETS	11	100.00	500.00	0.45	t	2025-10-06 08:27:16.169505	2025-10-06 08:27:16.169505
64	BOARD-400GSM-002	Cardboard - 400 GSM Brown	SHEETS	11	80.00	400.00	0.65	t	2025-10-06 08:27:16.17465	2025-10-06 08:27:16.17465
\.


--
-- Data for Name: inventory_locations; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.inventory_locations (location_id, location_name, location_code, description, is_active, created_at, updated_at) FROM stdin;
1	Main Store	MAIN	Primary inventory storage location	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
2	CTP Room	CTP	Computer-to-Plate equipment and materials	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
3	Production Floor	PROD	Production area inventory	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
4	Quality Control	QC	QC department inventory	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
5	Finished Goods	FG	Completed products storage	t	2025-10-06 08:25:57.566397	2025-10-06 08:25:57.566397
\.


--
-- Data for Name: inventory_logs; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.inventory_logs (id, "itemId", type, quantity, "previousQty", "newQty", notes, "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.inventory_transactions (txn_id, item_id, location_id, txn_type, txn_date, qty, unit, ref_no, department, job_card_no, remarks, unit_cost, total_value, created_by, created_at) FROM stdin;
167	44	1	OPENING_BALANCE	2024-01-01	216.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	45.50	9828.00	system	2025-10-06 08:27:16.19871
168	44	1	OUT	2025-09-27	48.00	PCS	ISS-827	Production	\N	Material issued for Production	45.50	2184.00	system	2025-10-06 08:27:16.209853
169	45	2	OPENING_BALANCE	2024-01-01	55.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	48.75	2681.25	system	2025-10-06 08:27:16.215903
170	45	2	IN	2025-09-28	53.00	PCS	GRN-370	Production	\N	Goods received for Production	48.75	2583.75	system	2025-10-06 08:27:16.223178
171	45	2	IN	2025-10-04	14.00	PCS	GRN-926	Production	\N	Goods received for Production	48.75	682.50	system	2025-10-06 08:27:16.237368
172	45	2	IN	2025-09-15	12.00	PCS	GRN-783	Quality Control	\N	Goods received for Quality Control	48.75	585.00	system	2025-10-06 08:27:16.240546
173	45	2	IN	2025-09-11	19.00	PCS	GRN-158	CTP	\N	Goods received for CTP	48.75	926.25	system	2025-10-06 08:27:16.244876
174	45	2	IN	2025-09-25	6.00	PCS	GRN-476	Quality Control	\N	Goods received for Quality Control	48.75	292.50	system	2025-10-06 08:27:16.261081
175	46	3	OPENING_BALANCE	2024-01-01	162.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	42.00	6804.00	system	2025-10-06 08:27:16.326938
176	46	3	OUT	2025-09-13	46.00	PCS	ISS-643	Purchase	\N	Material issued for Purchase	42.00	1932.00	system	2025-10-06 08:27:16.332471
177	46	3	IN	2025-09-10	18.00	PCS	GRN-465	Purchase	\N	Goods received for Purchase	42.00	756.00	system	2025-10-06 08:27:16.365134
178	46	3	OUT	2025-09-30	9.00	PCS	ISS-364	Production	\N	Material issued for Production	42.00	378.00	system	2025-10-06 08:27:16.369592
179	46	3	OUT	2025-09-25	5.00	PCS	ISS-590	Quality Control	\N	Material issued for Quality Control	42.00	210.00	system	2025-10-06 08:27:16.373083
180	47	4	OPENING_BALANCE	2024-01-01	214.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	52.25	11181.50	system	2025-10-06 08:27:16.376296
181	47	4	IN	2025-09-15	20.00	PCS	GRN-995	Quality Control	\N	Goods received for Quality Control	52.25	1045.00	system	2025-10-06 08:27:16.382051
182	47	4	IN	2025-09-09	51.00	PCS	GRN-206	Quality Control	\N	Goods received for Quality Control	52.25	2664.75	system	2025-10-06 08:27:16.388741
183	47	4	OUT	2025-09-29	40.00	PCS	ISS-956	Purchase	\N	Material issued for Purchase	52.25	2090.00	system	2025-10-06 08:27:16.413232
184	47	4	IN	2025-09-21	6.00	PCS	GRN-102	Production	\N	Goods received for Production	52.25	313.50	system	2025-10-06 08:27:16.420137
185	48	5	OPENING_BALANCE	2024-01-01	66.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	55.80	3682.80	system	2025-10-06 08:27:16.431904
186	48	5	IN	2025-09-14	48.00	PCS	GRN-645	Purchase	\N	Goods received for Purchase	55.80	2678.40	system	2025-10-06 08:27:16.437809
187	48	5	IN	2025-09-09	7.00	PCS	GRN-576	Purchase	\N	Goods received for Purchase	55.80	390.60	system	2025-10-06 08:27:16.443861
188	48	5	IN	2025-09-08	12.00	PCS	GRN-083	Quality Control	\N	Goods received for Quality Control	55.80	669.60	system	2025-10-06 08:27:16.448358
189	49	1	OPENING_BALANCE	2024-01-01	83.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	68.90	5718.70	system	2025-10-06 08:27:16.453862
190	49	1	OUT	2025-09-24	33.00	PCS	ISS-614	Purchase	\N	Material issued for Purchase	68.90	2273.70	system	2025-10-06 08:27:16.457058
191	49	1	OUT	2025-09-14	50.00	PCS	ISS-235	CTP	\N	Material issued for CTP	68.90	3445.00	system	2025-10-06 08:27:16.484713
192	49	1	OUT	2025-09-18	20.00	PCS	ISS-194	CTP	\N	Material issued for CTP	68.90	1378.00	system	2025-10-06 08:27:16.48811
193	50	2	OPENING_BALANCE	2024-01-01	245.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	2.50	612.50	system	2025-10-06 08:27:16.491533
194	50	2	OUT	2025-09-26	27.00	PCS	ISS-609	Purchase	\N	Material issued for Purchase	2.50	67.50	system	2025-10-06 08:27:16.504875
195	50	2	IN	2025-09-14	45.00	PCS	GRN-783	CTP	\N	Goods received for CTP	2.50	112.50	system	2025-10-06 08:27:16.511088
196	50	2	OUT	2025-09-07	45.00	PCS	ISS-482	Quality Control	\N	Material issued for Quality Control	2.50	112.50	system	2025-10-06 08:27:16.515086
197	50	2	OUT	2025-09-20	47.00	PCS	ISS-566	Quality Control	\N	Material issued for Quality Control	2.50	117.50	system	2025-10-06 08:27:16.518353
198	50	2	IN	2025-09-29	43.00	PCS	GRN-632	CTP	\N	Goods received for CTP	2.50	107.50	system	2025-10-06 08:27:16.521358
199	51	3	OPENING_BALANCE	2024-01-01	105.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	4.25	446.25	system	2025-10-06 08:27:16.534124
200	51	3	IN	2025-09-24	23.00	PCS	GRN-557	CTP	\N	Goods received for CTP	4.25	97.75	system	2025-10-06 08:27:16.540402
201	51	3	OUT	2025-10-01	27.00	PCS	ISS-792	Production	\N	Material issued for Production	4.25	114.75	system	2025-10-06 08:27:16.550249
202	52	4	OPENING_BALANCE	2024-01-01	213.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	6.75	1437.75	system	2025-10-06 08:27:16.572231
203	52	4	IN	2025-09-14	12.00	PCS	GRN-797	Quality Control	\N	Goods received for Quality Control	6.75	81.00	system	2025-10-06 08:27:16.57642
204	52	4	IN	2025-09-25	11.00	PCS	GRN-159	Quality Control	\N	Goods received for Quality Control	6.75	74.25	system	2025-10-06 08:27:16.579782
205	52	4	IN	2025-09-16	45.00	PCS	GRN-562	Quality Control	\N	Goods received for Quality Control	6.75	303.75	system	2025-10-06 08:27:16.583616
206	53	5	OPENING_BALANCE	2024-01-01	189.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	0.15	28.35	system	2025-10-06 08:27:16.614595
207	53	5	IN	2025-09-27	25.00	PCS	GRN-000	Production	\N	Goods received for Production	0.15	3.75	system	2025-10-06 08:27:16.61785
208	53	5	IN	2025-09-17	51.00	PCS	GRN-431	Quality Control	\N	Goods received for Quality Control	0.15	7.65	system	2025-10-06 08:27:16.630417
209	53	5	IN	2025-10-01	21.00	PCS	GRN-721	CTP	\N	Goods received for CTP	0.15	3.15	system	2025-10-06 08:27:16.633186
210	53	5	IN	2025-09-13	13.00	PCS	GRN-137	CTP	\N	Goods received for CTP	0.15	1.95	system	2025-10-06 08:27:16.636367
211	54	1	OPENING_BALANCE	2024-01-01	244.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	0.35	85.40	system	2025-10-06 08:27:16.639579
212	54	1	OUT	2025-09-10	34.00	PCS	ISS-646	CTP	\N	Material issued for CTP	0.35	11.90	system	2025-10-06 08:27:16.645562
213	54	1	OUT	2025-10-03	23.00	PCS	ISS-194	Production	\N	Material issued for Production	0.35	8.05	system	2025-10-06 08:27:16.659097
214	55	2	OPENING_BALANCE	2024-01-01	120.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	0.08	9.60	system	2025-10-06 08:27:16.665952
215	55	2	IN	2025-09-12	54.00	PCS	GRN-858	Purchase	\N	Goods received for Purchase	0.08	4.32	system	2025-10-06 08:27:16.681621
216	55	2	OUT	2025-09-13	14.00	PCS	ISS-971	Production	\N	Material issued for Production	0.08	1.12	system	2025-10-06 08:27:16.687505
217	55	2	IN	2025-10-03	16.00	PCS	GRN-780	Purchase	\N	Goods received for Purchase	0.08	1.28	system	2025-10-06 08:27:16.691999
218	55	2	IN	2025-09-20	54.00	PCS	GRN-199	Quality Control	\N	Goods received for Quality Control	0.08	4.32	system	2025-10-06 08:27:16.699227
219	56	3	OPENING_BALANCE	2024-01-01	149.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	0.12	17.88	system	2025-10-06 08:27:16.702577
220	56	3	IN	2025-09-20	21.00	PCS	GRN-492	Purchase	\N	Goods received for Purchase	0.12	2.52	system	2025-10-06 08:27:16.705906
221	56	3	IN	2025-09-11	52.00	PCS	GRN-553	Quality Control	\N	Goods received for Quality Control	0.12	6.24	system	2025-10-06 08:27:16.711044
222	57	4	OPENING_BALANCE	2024-01-01	154.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	12.50	1925.00	system	2025-10-06 08:27:16.714127
223	57	4	IN	2025-09-08	43.00	PCS	GRN-774	Production	\N	Goods received for Production	12.50	537.50	system	2025-10-06 08:27:16.732475
224	57	4	IN	2025-09-23	10.00	PCS	GRN-009	Production	\N	Goods received for Production	12.50	125.00	system	2025-10-06 08:27:16.743273
225	58	5	OPENING_BALANCE	2024-01-01	220.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	18.75	4125.00	system	2025-10-06 08:27:16.750389
226	58	5	IN	2025-09-17	44.00	PCS	GRN-865	Quality Control	\N	Goods received for Quality Control	18.75	825.00	system	2025-10-06 08:27:16.756233
227	58	5	OUT	2025-09-07	35.00	PCS	ISS-059	Quality Control	\N	Material issued for Quality Control	18.75	656.25	system	2025-10-06 08:27:16.761317
228	59	1	OPENING_BALANCE	2024-01-01	54.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	25.00	1350.00	system	2025-10-06 08:27:16.767244
229	59	1	IN	2025-09-29	11.00	PCS	GRN-716	CTP	\N	Goods received for CTP	25.00	275.00	system	2025-10-06 08:27:16.770277
230	59	1	IN	2025-09-15	25.00	PCS	GRN-835	Production	\N	Goods received for Production	25.00	625.00	system	2025-10-06 08:27:16.789686
231	59	1	OUT	2025-09-20	43.00	PCS	ISS-724	Production	\N	Material issued for Production	25.00	1075.00	system	2025-10-06 08:27:16.792614
232	59	1	OUT	2025-09-27	48.00	PCS	ISS-841	Quality Control	\N	Material issued for Quality Control	25.00	1200.00	system	2025-10-06 08:27:16.795573
233	60	2	OPENING_BALANCE	2024-01-01	84.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	22.50	1890.00	system	2025-10-06 08:27:16.800358
234	60	2	OUT	2025-09-18	36.00	PCS	ISS-008	Production	\N	Material issued for Production	22.50	810.00	system	2025-10-06 08:27:16.803488
235	61	3	OPENING_BALANCE	2024-01-01	216.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	8.50	1836.00	system	2025-10-06 08:27:16.806324
236	61	3	OUT	2025-09-26	7.00	PCS	ISS-794	Quality Control	\N	Material issued for Quality Control	8.50	59.50	system	2025-10-06 08:27:16.815343
237	61	3	OUT	2025-09-23	44.00	PCS	ISS-240	Purchase	\N	Material issued for Purchase	8.50	374.00	system	2025-10-06 08:27:16.818344
238	62	4	OPENING_BALANCE	2024-01-01	224.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	12.25	2744.00	system	2025-10-06 08:27:16.821635
239	62	4	IN	2025-09-12	46.00	PCS	GRN-662	Production	\N	Goods received for Production	12.25	563.50	system	2025-10-06 08:27:16.82603
240	62	4	OUT	2025-09-19	22.00	PCS	ISS-812	Production	\N	Material issued for Production	12.25	269.50	system	2025-10-06 08:27:16.829321
241	62	4	IN	2025-09-09	8.00	PCS	GRN-266	Purchase	\N	Goods received for Purchase	12.25	98.00	system	2025-10-06 08:27:16.832955
242	62	4	IN	2025-10-05	11.00	PCS	GRN-311	CTP	\N	Goods received for CTP	12.25	134.75	system	2025-10-06 08:27:16.863211
243	62	4	OUT	2025-09-28	45.00	PCS	ISS-657	CTP	\N	Material issued for CTP	12.25	551.25	system	2025-10-06 08:27:16.866111
244	63	5	OPENING_BALANCE	2024-01-01	145.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	0.45	65.25	system	2025-10-06 08:27:16.869095
245	63	5	OUT	2025-09-08	52.00	PCS	ISS-708	Purchase	\N	Material issued for Purchase	0.45	23.40	system	2025-10-06 08:27:16.871446
246	63	5	IN	2025-09-14	49.00	PCS	GRN-862	Purchase	\N	Goods received for Purchase	0.45	22.05	system	2025-10-06 08:27:16.87443
247	63	5	IN	2025-10-01	32.00	PCS	GRN-859	Quality Control	\N	Goods received for Quality Control	0.45	14.40	system	2025-10-06 08:27:16.877397
248	64	1	OPENING_BALANCE	2024-01-01	186.00	PCS	OB-2024-001	Store	\N	Opening balance for 2024	0.65	120.90	system	2025-10-06 08:27:16.879795
249	64	1	OUT	2025-10-01	43.00	PCS	ISS-937	Production	\N	Material issued for Production	0.65	27.95	system	2025-10-06 08:27:16.882444
250	64	1	IN	2025-09-29	27.00	PCS	GRN-449	Quality Control	\N	Goods received for Quality Control	0.65	17.55	system	2025-10-06 08:27:16.885089
251	64	1	IN	2025-09-20	25.00	PCS	GRN-007	CTP	\N	Goods received for CTP	0.65	16.25	system	2025-10-06 08:27:16.887902
252	64	1	OUT	2025-10-01	14.00	PCS	ISS-449	Purchase	\N	Material issued for Purchase	0.65	9.10	system	2025-10-06 08:27:16.891143
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.invoices (invoice_id, invoice_number, supplier_id, po_id, grn_id, invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, currency, status, payment_terms, payment_method, paid_date, paid_amount, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: item_specifications; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.item_specifications (id, job_card_id, excel_file_link, excel_file_name, po_number, job_number, brand_name, item_name, uploaded_at, item_count, total_quantity, size_variants, color_variants, specifications, raw_excel_data, created_at, created_by, updated_at) FROM stdin;
\.


--
-- Data for Name: job_attachments; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.job_attachments (id, job_card_id, file_name, file_path, file_size, file_type, uploaded_by, created_at) FROM stdin;
\.


--
-- Data for Name: job_cards; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.job_cards (id, "jobNumber", "companyId", "productId", "sequenceId", quantity, urgency, status, "dueDate", "startDate", "endDate", "totalCost", notes, "createdById", "assignedToId", "createdAt", "updatedAt", po_number, customer_name, customer_email, customer_phone, customer_address, client_layout_link, final_design_link, qa_notes, qa_approved_by, qa_approved_at) FROM stdin;
1	JOB-2024-001	3	9	6	5000	HIGH	PENDING	2025-09-21 10:28:46.7	\N	\N	2250.000000000000000000000000000000	Rush order for Nike Air Max collection launch	2	\N	2025-09-14 10:28:46.816	2025-09-14 10:28:46.816	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	JOB-2024-002	4	47	7	3000	NORMAL	PENDING	2025-09-28 10:28:46.7	\N	\N	2100.000000000000000000000000000000	Sustainable woven labels for Adidas eco collection	2	\N	2025-09-14 10:28:52.094	2025-09-14 10:28:52.094	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	JOB-2024-003	5	53	4	2500	URGENT	PENDING	2025-09-17 10:28:46.7	\N	\N	2200.000000000000000000000000000000	Glow-in-dark heat transfer labels for limited edition	2	\N	2025-09-14 10:28:56.431	2025-09-14 10:28:56.431	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	JOB-2024-004	6	34	5	10000	NORMAL	PENDING	2025-10-05 10:28:46.7	\N	\N	1000.000000000000000000000000000000	Care labels for Under Armour tech fabric line	2	\N	2025-09-14 10:29:03.128	2025-09-14 10:29:03.128	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	JOB-2024-005	7	60	8	1500	LOW	PENDING	2025-10-14 10:28:46.7	\N	\N	3375.000000000000000000000000000000	Sustainable leather patches for H&M premium line	2	\N	2025-09-14 10:29:06.669	2025-09-14 10:29:06.669	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
12	JC-SUCCESS-TEST	1	74	1	100	NORMAL	PENDING	2025-09-23 00:00:00	\N	\N	0.000000000000000000000000000000		1	\N	2025-09-16 05:40:54.688	2025-09-16 10:40:56.832	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
13	JC-1757999914179	1	74	1	500	NORMAL	PENDING	2025-09-23 00:00:00	\N	\N	0.000000000000000000000000000000		1	\N	2025-09-16 05:42:19.159	2025-09-16 10:42:23.354	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
14	JC-1758001698991	1	74	1	500	NORMAL	PENDING	2025-09-17 00:00:00	\N	\N	0.000000000000000000000000000000		1	\N	2025-09-16 05:48:17.111	2025-09-16 10:48:19.323	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
15	JC-1758015966886	1	76	1	7500	NORMAL	PENDING	2025-09-25 00:00:00	\N	\N	0.000000000000000000000000000000		1	\N	2025-09-16 09:46:04.456	2025-09-16 14:46:07.467	PO1234	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area	\N	\N	\N	\N	\N
48	JC-1758112241894	1	76	1	500	NORMAL	PENDING	2025-09-19 00:00:00	\N	\N	0.000000000000000000000000000000		1	\N	2025-09-17 12:30:41.913	2025-09-17 17:30:41.911	PO1234	Surti Textile	surti@gmail.com			\N	\N	\N	\N	\N
49	JC-1758112247827	1	76	1	500	NORMAL	PENDING	2025-09-19 00:00:00	\N	\N	0.000000000000000000000000000000		1	\N	2025-09-17 12:30:47.9	2025-09-17 17:30:47.885	PO1234	Surti Textile	surti@gmail.com			\N	\N	\N	\N	\N
50	JC-1758112265551	1	76	1	500	NORMAL	PENDING	2025-09-19 00:00:00	\N	\N	0.000000000000000000000000000000		1	\N	2025-09-17 12:31:05.919	2025-09-17 17:31:05.915	PO1234	Surti Textile	surti@gmail.com			\N	\N	\N	\N	\N
51	JC-1758112314352	1	76	1	500	NORMAL	PENDING	2025-09-19 00:00:00	\N	\N	0.000000000000000000000000000000		1	\N	2025-09-17 12:31:54.444	2025-09-17 17:31:54.423	PO1234	Surti Textile	surti@gmail.com			\N	\N	\N	\N	\N
53	JC-1758113138781	1	76	1	300	NORMAL	PENDING	2025-09-24 00:00:00	\N	\N	0.000000000000000000000000000000		1	\N	2025-09-17 12:45:38.823	2025-09-17 17:45:38.795	PO1234	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area	\N	\N	\N	\N	\N
70	JC-1758797752046	1	82	1	500	NORMAL	COMPLETED	2025-10-03 00:00:00	\N	\N	0.000000000000000000000000000000		1	17	2025-09-25 10:55:47.252	2025-09-26 10:09:57.235	PO1234	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area	https://drive.google.com/file/d/1TZCty9m8CzbZ-cwUoL0Oq7kCXcwwSG1i/view?usp=sharing	https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view	not same	\N	\N
57	JC-1758280187723	1	78	1	500	NORMAL	IN_PROGRESS	2025-09-27 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-19 11:09:47.567	2025-09-22 12:39:11.449	P123456	abdul azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area Khi	\N	\N	\N	\N	\N
59	JC-1758514422624	1	79	1	500	NORMAL	IN_PROGRESS	2025-09-24 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-22 04:13:41.394	2025-09-22 12:54:20.549	PO1234	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area	\N	\N	\N	\N	\N
56	JC-1758180730091	1	77	1	5000	NORMAL	IN_PROGRESS	2025-09-27 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-18 07:32:10.162	2025-09-23 05:29:57.742	P123455	Bilal Hasan	bilal.ata45@gmail.com	+923363219492	Gulberg\nR/1193	\N	\N	\N	\N	\N
55	JC-1758178374094	1	77	1	1000	URGENT	IN_PROGRESS	2025-09-27 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-18 06:52:54.55	2025-09-23 05:31:10.51	P1234	Surti Textile	surti@gmail.com			\N	\N	\N	\N	\N
52	JC-1758112691671	1	76	1	500	NORMAL	IN_PROGRESS	2025-09-19 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-17 12:38:12.022	2025-09-23 05:34:31.626	PO1234	Surti Textile	surti@gmail.com			\N	\N	\N	\N	\N
54	JC-1758177004827	1	77	1	500	NORMAL	IN_PROGRESS	2025-09-19 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-18 06:30:04.896	2025-09-23 09:56:50.464	P1234	Surti Textile	surti@gmail.com			\N	\N	\N	\N	\N
60	JC-1758625853992	1	80	1	500	NORMAL	PENDING	2025-09-25 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-23 11:10:51.082	2025-09-23 16:10:54.012	PO1234	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area	\N	\N	\N	\N	\N
67	JC-1758794903189	1	82	1	8000	HIGH	SUBMITTED_TO_QA	2025-10-03 00:00:00	\N	\N	0.000000000000000000000000000000		1	17	2025-09-25 10:08:18.363	2025-09-25 16:33:51.705	PO#1981	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524		https://drive.google.com/drive/folders/10iK165kFKaSh1FrXKyU9SrFUX4pTMj91	https://drive.google.com/file/d/19ZG_4Cwh2Np5XOwAD0l4Yoyawn-GNtqe/view?usp=drive_link	\N	\N	\N
62	JC-1758627380708	1	81	1	90000	NORMAL	PENDING	2025-10-02 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-23 11:36:16.583	2025-09-23 16:36:20.794	Rajbi445	Rajbi	rajbi@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area	\N	\N	\N	\N	\N
66	JC-1758784699841	1	82	1	800	NORMAL	IN_PROGRESS	2025-09-30 00:00:00	\N	\N	0.000000000000000000000000000000		1	13	2025-09-25 07:18:14.705	2025-09-25 07:44:40.02	PO#1981	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524		\N	\N	\N	\N	\N
65	JC-1758783777120	1	82	1	800	NORMAL	IN_PROGRESS	2025-10-03 00:00:00	\N	\N	0.000000000000000000000000000000		1	15	2025-09-25 07:02:51.65	2025-09-25 07:46:51.906	PO#1981	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524		\N	\N	\N	\N	\N
64	JC-1758778859358	1	82	1	600	NORMAL	IN_PROGRESS	2025-10-02 00:00:00	\N	\N	0.000000000000000000000000000000		1	18	2025-09-25 05:40:59.396	2025-09-25 08:15:49.336	PO#1981	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524		\N	\N	\N	\N	\N
61	JC-1758626082060	1	79	1	1	NORMAL	IN_PROGRESS	2025-10-02 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-23 11:14:39.737	2025-09-23 11:16:31.405	123we	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area	https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view	https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view	\N	\N	\N
58	JC-1758282008816	1	79	1	500	HIGH	IN_PROGRESS	2025-09-30 00:00:00	\N	\N	0.000000000000000000000000000000		1	8	2025-09-19 11:40:09.22	2025-09-22 12:33:15.877	P123456	abdul azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area Khi	https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view	https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view	\N	\N	\N
68	JC-1758795086531	1	82	1	1	NORMAL	SUBMITTED_TO_QA	2025-10-03 00:00:00	\N	\N	0.000000000000000000000000000000		1	17	2025-09-25 10:11:21.422	2025-09-25 12:24:16.12	PO#1981	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524		https://drive.google.com/drive/folders/10iK165kFKaSh1FrXKyU9SrFUX4pTMj91	https://drive.google.com/file/d/19ZG_4Cwh2Np5XOwAD0l4Yoyawn-GNtqe/view?usp=drive_link	\N	\N	\N
63	JC-1758776793327	1	82	1	5000	NORMAL	IN_PROGRESS	2025-10-02 00:00:00	\N	\N	0.000000000000000000000000000000		1	15	2025-09-25 05:06:28.19	2025-09-25 16:34:30.596	PO#1981	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524		\N	\N	\N	\N	\N
71	JC-1758822396422	1	82	1	1600	NORMAL	APPROVED_BY_QA	2025-10-02 00:00:00	\N	\N	0.000000000000000000000000000000		1	17	2025-09-25 17:46:30.557	2025-09-26 06:47:51.834	PO123	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524		https://drive.google.com/file/d/1FHYrssyLa2icijhsobWJ9DGntkKWrbRP/view?usp=sharing	https://drive.google.com/file/d/1M5OzsI9A1q88Zx5rU7P1frXSzGEzZe4t/view?usp=sharing		23	2025-09-26 06:47:51.834233+00
69	JC-1758796560925	1	82	1	6805	URGENT	APPROVED_BY_QA	2025-10-02 00:00:00	\N	\N	0.000000000000000000000000000000		1	17	2025-09-25 10:36:01.58	2025-09-27 08:05:18.709	PO123	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524		https://drive.google.com/drive/folders/10iK165kFKaSh1FrXKyU9SrFUX4pTMj91	https://drive.google.com/file/d/19ZG_4Cwh2Np5XOwAD0l4Yoyawn-GNtqe/view?usp=drive_link		23	2025-09-27 08:05:18.708506+00
73	JC-1758983859381	1	85	1	600	URGENT	PENDING	2025-10-02 00:00:00	\N	\N	0.000000000000000000000000000000		1	18	2025-09-27 14:37:33.347	2025-09-27 19:37:39.429	P123456	abdul azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area Khi	https://drive.google.com/file/d/1M5OzsI9A1q88Zx5rU7P1frXSzGEzZe4t/view?usp=sharing	\N	\N	\N	\N
72	JC-1758960701247	1	83	1	150000	NORMAL	APPROVED_BY_QA	2025-09-30 00:00:00	\N	\N	0.000000000000000000000000000000		1	13	2025-09-27 08:11:34.928	2025-09-27 08:30:57.784	PO156	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area	https://drive.google.com/file/d/1TZCty9m8CzbZ-cwUoL0Oq7kCXcwwSG1i/view?usp=sharing	https://drive.google.com/file/d/1M5OzsI9A1q88Zx5rU7P1frXSzGEzZe4t/view?usp=sharing		23	2025-09-27 08:30:57.783859+00
74	JC-1759224776885	1	86	1	500	URGENT	SUBMITTED_TO_QA	2025-10-22 00:00:00	\N	\N	0.000000000000000000000000000000		1	18	2025-09-30 09:32:57.134	2025-09-30 09:35:19.842	P0321	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995/19 alnoor society F.b area	https://drive.google.com/file/d/1M5OzsI9A1q88Zx5rU7P1frXSzGEzZe4t/view	https://drive.google.com/file/d/1M5OzsI9A1q88Zx5rU7P1frXSzGEzZe4t/view?usp=sharing	\N	\N	\N
75	JC-1759226742860	1	86	1	5000	NORMAL	APPROVED_BY_QA	2025-10-02 00:00:00	\N	\N	0.000000000000000000000000000000		1	18	2025-09-30 10:05:43.235	2025-09-30 10:09:37.002	P0321	Rajbi				https://drive.google.com/file/d/1M5OzsI9A1q88Zx5rU7P1frXSzGEzZe4t/view?usp=sharing	https://drive.google.com/file/d/1M5OzsI9A1q88Zx5rU7P1frXSzGEzZe4t/view		23	2025-09-30 10:09:37.001788+00
77	JC-1759297646118	1	86	1	5000	HIGH	APPROVED_BY_QA	2025-10-15 00:00:00	\N	\N	0.000000000000000000000000000000		1	18	2025-10-01 05:47:26.485	2025-10-01 06:05:52.046	Po345	Surti	surti@hotmail.com			https://drive.google.com/file/d/15R047Zjv7NKY18Iq_g86LGbzNMPZvDjB/view?usp=sharing	https://drive.google.com/file/d/15R047Zjv7NKY18Iq_g86LGbzNMPZvDjB/view?usp=sharing		23	2025-10-01 06:05:52.046051+00
78	JC-1759473825689	1	87	1	400	NORMAL	PENDING	2025-10-10 00:00:00	\N	\N	0.000000000000000000000000000000		1	18	2025-10-03 06:43:44.892	2025-10-03 11:43:46.075	PO#1981	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area	https://drive.google.com/file/d/1M5OzsI9A1q88Zx5rU7P1frXSzGEzZe4t/view?usp=sharing	\N	\N	\N	\N
76	JC-1759291151339	1	86	1	560	NORMAL	APPROVED_BY_QA	2025-10-08 00:00:00	\N	\N	0.000000000000000000000000000000		1	18	2025-10-01 03:59:11.696	2025-10-05 06:53:56.829	P0321	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995/19 alnoor society F.b area	https://drive.google.com/file/d/1M5OzsI9A1q88Zx5rU7P1frXSzGEzZe4t/view?usp=sharing	https://drive.google.com/file/d/15R047Zjv7NKY18Iq_g86LGbzNMPZvDjB/view?usp=sharing		23	2025-10-05 06:53:56.829119+00
79	JC-1759908753911	1	88	1	27110	NORMAL	IN_PROGRESS	2025-10-15 00:00:00	\N	\N	0.000000000000000000000000000000		1	20	2025-10-08 07:32:33.684	2025-10-08 07:38:44.117	166880	Artistic Fabric Mills (pvt )ltd 					\N	\N	\N	\N
80	JC-1762158399607	1	90	1	500	NORMAL	PENDING	2025-11-11 00:00:00	\N	\N	0.000000000000000000000000000000		1	20	2025-11-03 08:26:07.172	2025-11-03 08:26:07.171	PO1234	Abdul Azeem	abdulazeem911@hotmail.com	+923413076524	R-995 Block 19 Alnoor Society Federal B Area		\N	\N	\N	\N
82	JC-1762243451871	1	92	1	35000	LOW	REVISIONS_REQUIRED	2025-11-21 00:00:00	\N	\N	0.000000000000000000000000000000		1	17	2025-11-04 08:03:39.423	2025-11-04 08:34:28.674	24101	ARTISTIC MILLINERS PVT (LTD)	abdullah@horizonsourcing.net.pk	+92 301 8447574		https://drive.google.com/file/d/1XVMyOZ9la01ozlpAYkFbKEQNehJJW5mY/view?usp=sharing	https://drive.google.com/file/d/1Xi_4d3c07861_F0XJzWQ4n-i-XNOftI5/view?usp=sharing		\N	\N
81	JC-1762174261187	1	91	1	831	URGENT	APPROVED_BY_QA	2025-11-05 00:00:00	\N	\N	0.000000000000000000000000000000		1	17	2025-11-03 12:51:01.243	2025-11-04 08:35:03.476	NR10/0403/25	ARTISTIC MILLINERS PVT (LTD)	abdullah@horizonsourcing.net.pk	+923018447574	PLOT NO.4, SECTOR 25, KORANGI INDUSTRIAL AREA KARACHI.	https://drive.google.com/file/d/1H9L1K79BTuJfUVjx1soHIccN364ucxqM/view?usp=sharing	https://drive.google.com/file/d/1Xi_4d3c07861_F0XJzWQ4n-i-XNOftI5/view?usp=sharing		33	2025-11-04 08:35:03.476427+00
\.


--
-- Data for Name: job_lifecycles; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.job_lifecycles (id, "jobCardId", "processStepId", status, "startTime", "endTime", duration, "qualityCheck", notes, "userId", "createdAt", "updatedAt") FROM stdin;
1	1	7	IN_PROGRESS	\N	\N	\N	\N	Step 1: Prepress - Started	2	2025-09-14 10:28:48.868	2025-09-14 10:28:48.868
2	1	8	PENDING	\N	\N	\N	\N	Step 2: Material Procurement - Waiting	2	2025-09-14 10:28:48.982	2025-09-14 10:28:48.982
3	1	9	PENDING	\N	\N	\N	\N	Step 3: Material Issuance - Waiting	2	2025-09-14 10:28:51.446	2025-09-14 10:28:51.446
4	2	61	IN_PROGRESS	\N	\N	\N	\N	Step 1: Prepress - Started	2	2025-09-14 10:28:55.113	2025-09-14 10:28:55.113
5	2	62	PENDING	\N	\N	\N	\N	Step 2: Material Procurement - Waiting	2	2025-09-14 10:28:55.614	2025-09-14 10:28:55.614
6	2	63	PENDING	\N	\N	\N	\N	Step 3: Material Issuance - Waiting	2	2025-09-14 10:28:56.101	2025-09-14 10:28:56.101
7	3	38	IN_PROGRESS	\N	\N	\N	\N	Step 1: Prepress - Started	2	2025-09-14 10:28:56.604	2025-09-14 10:28:56.604
8	3	39	PENDING	\N	\N	\N	\N	Step 2: Material Procurement - Waiting	2	2025-09-14 10:28:56.919	2025-09-14 10:28:56.919
9	3	40	PENDING	\N	\N	\N	\N	Step 3: Material Issuance - Waiting	2	2025-09-14 10:28:57.238	2025-09-14 10:28:57.238
10	4	49	IN_PROGRESS	\N	\N	\N	\N	Step 1: Prepress - Started	2	2025-09-14 10:29:03.84	2025-09-14 10:29:03.84
11	4	50	PENDING	\N	\N	\N	\N	Step 2: Material Procurement - Waiting	2	2025-09-14 10:29:04.376	2025-09-14 10:29:04.376
12	4	51	PENDING	\N	\N	\N	\N	Step 3: Material Issuance - Waiting	2	2025-09-14 10:29:04.496	2025-09-14 10:29:04.496
13	5	75	IN_PROGRESS	\N	\N	\N	\N	Step 1: Prepress - Started	2	2025-09-14 10:29:07.045	2025-09-14 10:29:07.045
14	5	76	PENDING	\N	\N	\N	\N	Step 2: Material Procurement - Waiting	2	2025-09-14 10:29:07.535	2025-09-14 10:29:07.535
15	5	77	PENDING	\N	\N	\N	\N	Step 3: Material Issuance - Waiting	2	2025-09-14 10:29:07.603	2025-09-14 10:29:07.603
\.


--
-- Data for Name: job_process_selections; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.job_process_selections (id, "jobId", "processStepId", is_selected, "createdAt", "updatedAt") FROM stdin;
a0cacfb4-799a-447c-b267-bc5a9bc77596	57	7	t	2025-09-23 07:12:44.157383+00	2025-09-23 07:12:44.157383+00
befbae2e-ded8-437a-a293-3c6b0a1f1fb0	57	8	t	2025-09-23 07:12:44.157383+00	2025-09-23 07:12:44.157383+00
f3f7ea02-ab8d-415a-aba2-a4d71ff33be9	57	9	t	2025-09-23 07:12:44.157383+00	2025-09-23 07:12:44.157383+00
6cf2892d-1958-479d-b153-350ad09f56ca	57	10	t	2025-09-23 07:12:44.157383+00	2025-09-23 07:12:44.157383+00
35a7a45c-b11d-49ba-aacc-ddfa3223e0cd	57	35	t	2025-09-23 07:12:44.157383+00	2025-09-23 07:12:44.157383+00
9df00753-4750-46e9-b0e7-8b43b1b5283f	59	7	t	2025-09-23 07:19:27.276635+00	2025-09-23 07:19:27.276635+00
cdce94ce-8135-48b3-946c-d624135d39a1	59	8	t	2025-09-23 07:19:27.276635+00	2025-09-23 07:19:27.276635+00
cb7d6bda-1b4f-4847-a657-8f87281b4a21	59	9	t	2025-09-23 07:19:27.276635+00	2025-09-23 07:19:27.276635+00
5bfc62d3-24b5-4e96-bfb6-91632639c301	59	10	t	2025-09-23 07:19:27.276635+00	2025-09-23 07:19:27.276635+00
f2e4ae18-89ad-423a-aba6-88eed8f95fb4	59	35	t	2025-09-23 07:19:27.276635+00	2025-09-23 07:19:27.276635+00
8f8c912e-935d-4557-a947-8909f18dc3d7	62	7	t	2025-09-23 11:42:21.580292+00	2025-09-23 11:42:21.580292+00
8c9ea5ef-d980-40d8-9f71-1e5cd093c1c6	62	17	t	2025-09-23 11:42:21.580292+00	2025-09-23 11:42:21.580292+00
1d23fe5a-fcd2-4ee4-a475-bb42625821bb	62	18	t	2025-09-23 11:42:21.580292+00	2025-09-23 11:42:21.580292+00
07767c24-11c2-45cb-bdf2-03d384486dc3	62	19	t	2025-09-23 11:42:21.580292+00	2025-09-23 11:42:21.580292+00
b280799c-fab0-4bee-b5ea-a7f41e7a0930	62	20	t	2025-09-23 11:42:21.580292+00	2025-09-23 11:42:21.580292+00
735e0fb1-c496-49c3-9da5-4c71be42eee2	62	35	t	2025-09-23 11:42:21.580292+00	2025-09-23 11:42:21.580292+00
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.materials (id, name, description, unit, "costPerUnit", "isActive", "createdAt", "updatedAt") FROM stdin;
39	FREE CENTO PW	Free Cento Paper White	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
40	FREE CENTO PW BLACK	Free Cento Paper White Black	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
41	SYM FREE MATT PLUS	Sym Free Matt Plus	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
42	FABRIANO LIFE PT	Fabriano Life Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
43	ECO LIFE PT 100	Eco Life Paper 100	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
44	ECO LIFE 100 WHITE	Eco Life 100 White	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
45	AREENA WHITE ROUGH	Areena White Rough	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
46	AREENA NATURAL ROUGH	Areena Natural Rough	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
47	AREENA NATURAL SMOOTH	Areena Natural Smooth	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
48	AREENA EW SMOOTH	Areena EW Smooth	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
49	AREENA WHITE SMOOTH	Areena White Smooth	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
50	WOOD STOCK CAMOSCIO	Wood Stock Camoscio	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
51	OLD MILL BIANCO	Old Mill Bianco	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
52	SIRIO BLACK	Sirio Black	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
53	SML ECRU FANCY CARD	SML Ecru Fancy Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
54	LEVIS FANCY ART CARD	Levis Fancy Art Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
55	BIANCO FLASH MASTER	Bianco Flash Master	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
56	LEVIS M.B MONADNOCK	Levis M.B Monadnock	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
57	ECO KRAFT	Eco Kraft	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
58	MATERICA ACQUA	Materica Acqua	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
59	MATERICA CLAY	Materica Clay	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
60	MATERICA QUARZ	Materica Quarz	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
61	SIRIO PIETRA	Sirio Pietra	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
62	SIRIO SABBAIA	Sirio Sabbia	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
63	SIRIO PERLA	Sirio Perla	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
64	Fasson Transcode White	Fasson Transcode White	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
65	Fasson Transparent	Fasson Transparent	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
66	C2S Art Card	C2S Art Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
67	C1S Bleach Card	C1S Bleach Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
68	U2S Un Coated Card	U2S Un Coated Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
69	Kraft Card	Kraft Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
70	CCNB Bux Board Card	CCNB Bux Board Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
71	CCWB Bux Board Card	CCWB Bux Board Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
72	Fancy Card	Fancy Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
73	Fancy Black Card	Fancy Black Card	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
74	Tyvek Paper	Tyvek Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
75	Yupo Paper	Yupo Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
76	Art Paper White	Art Paper White	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
77	Offset Paper News	Offset Paper News	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
78	Fasson Sticker Matt	Fasson Sticker Matt	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
79	Lintec Sticker Gloss	Lintec Sticker Gloss	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
80	Transparent Sticker	Transparent Sticker	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
81	Tearable Taffeta Paper	Tearable Taffeta Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
82	Tearabel Naylon Taffeta	Tearable Nylon Taffeta	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
83	Non-tearable Taffeta Paper	Non-tearable Taffeta Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
84	Non-tearabel Naylon Taffeta	Non-tearable Nylon Taffeta	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
85	C1S	Coated One Side	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
86	C2S	Coated Two Sides	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
87	Kraft	Kraft Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
88	Art Paper	Art Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
89	Duplex	Duplex Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
90	Corrugated	Corrugated Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
91	Coated Paper	Coated Paper	pcs	0.000000000000000000000000000000	t	2025-09-16 08:22:19.529	2025-09-16 08:22:19.529
\.


--
-- Data for Name: prepress_activity; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.prepress_activity (id, prepress_job_id, actor_id, action, from_status, to_status, remark, metadata, created_at) FROM stdin;
3	3	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-25 07:02:51.883609
4	3	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-25 07:02:51.94816
5	4	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-25 07:18:15.198035
6	4	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-25 07:18:15.203161
7	5	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-25 10:08:18.877443
8	5	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-25 10:08:18.972169
9	6	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-25 10:11:22.558881
10	6	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-25 10:11:22.566854
11	7	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-25 10:36:02.171523
12	7	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-25 10:36:02.311436
13	8	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-25 10:55:47.662744
14	8	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-25 10:55:47.795734
16	8	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-25 11:44:15.640845
17	7	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-25 11:58:35.607891
18	8	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-25 12:14:19.914138
19	8	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-25 12:14:21.712245
20	7	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-25 12:16:58.709731
21	6	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-25 12:24:16.130194
22	5	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-25 16:33:51.715877
23	9	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-25 17:46:32.109853
24	9	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-25 17:46:32.365272
25	9	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-25 17:49:51.260896
26	9	23	APPROVED_BY_QA	SUBMITTED_TO_QA	APPROVED_BY_QA	Approved by QA	{}	2025-09-26 06:47:51.891379
27	8	23	REVISIONS_REQUIRED	SUBMITTED_TO_QA	REVISIONS_REQUIRED	not same	{}	2025-09-26 10:08:07.753277
28	7	23	APPROVED_BY_QA	SUBMITTED_TO_QA	APPROVED_BY_QA	Approved by QA	{}	2025-09-27 08:05:18.796468
29	10	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-27 08:11:35.16343
30	10	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-27 08:11:35.240484
31	10	13	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-27 08:29:51.341199
32	10	23	APPROVED_BY_QA	SUBMITTED_TO_QA	APPROVED_BY_QA	Approved by QA	{}	2025-09-27 08:30:57.796616
33	11	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-27 14:37:33.611071
34	11	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-27 14:37:33.641031
35	12	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-30 09:32:57.328304
36	12	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-30 09:32:57.337327
37	12	18	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-30 09:35:19.886307
38	13	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-09-30 10:05:43.547862
39	13	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-09-30 10:05:43.556042
40	13	18	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-09-30 10:08:01.854256
41	13	23	APPROVED_BY_QA	SUBMITTED_TO_QA	APPROVED_BY_QA	Approved by QA	{}	2025-09-30 10:09:37.046303
42	14	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-10-01 03:59:12.004076
43	14	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-10-01 03:59:12.017108
44	14	18	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-10-01 04:53:21.073985
45	15	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-10-01 05:47:26.787529
46	15	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-10-01 05:47:26.841799
47	15	18	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-10-01 06:04:55.347966
48	15	23	APPROVED_BY_QA	SUBMITTED_TO_QA	APPROVED_BY_QA	Approved by QA	{}	2025-10-01 06:05:52.062391
49	16	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-10-03 06:43:45.247631
50	16	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-10-03 06:43:45.309485
51	14	23	APPROVED_BY_QA	SUBMITTED_TO_QA	APPROVED_BY_QA	Approved by QA	{}	2025-10-05 06:53:56.889845
52	17	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-10-08 07:32:34.348781
53	17	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-10-08 07:32:34.357182
54	18	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-11-03 08:26:07.200294
55	18	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-11-03 08:26:07.20295
56	19	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-11-03 12:50:28.740387
57	19	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-11-03 12:50:28.742778
58	19	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-11-04 07:58:40.625406
59	20	2	STATUS_CHANGED	\N	ASSIGNED	Prepress job created	{}	2025-11-04 08:03:39.688553
60	20	2	ASSIGNED	PENDING	ASSIGNED	Initial assignment	{}	2025-11-04 08:03:39.690113
61	20	17	SUBMITTED_TO_QA	IN_PROGRESS	SUBMITTED_TO_QA	Submitted to QA for review	{}	2025-11-04 08:32:24.033926
62	20	33	REVISIONS_REQUIRED	SUBMITTED_TO_QA	REVISIONS_REQUIRED	Revisions required by QA	{}	2025-11-04 08:34:28.67959
63	19	33	APPROVED_BY_QA	SUBMITTED_TO_QA	APPROVED_BY_QA	Approved by QA	{}	2025-11-04 08:35:03.480985
\.


--
-- Data for Name: prepress_jobs; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.prepress_jobs (id, job_card_id, assigned_designer_id, status, priority, due_date, started_at, completed_at, hod_last_remark, created_by, updated_by, created_at, updated_at, plate_generated, plate_generated_at, plate_generated_by, plate_count, ctp_notes, plate_tag_printed, plate_tag_printed_at) FROM stdin;
1	63	13	ASSIGNED	MEDIUM	2025-09-25 10:37:04.283	\N	\N	\N	12	12	2025-09-25 05:37:05.364984	2025-09-25 05:37:05.364984	f	\N	\N	0	\N	f	\N
2	64	14	ASSIGNED	MEDIUM	2025-10-02 05:00:00	\N	\N	\N	2	2	2025-09-25 05:40:54.436496	2025-09-25 05:40:54.436496	f	\N	\N	0	\N	f	\N
3	65	14	ASSIGNED	MEDIUM	2025-10-03 05:00:00	\N	\N	\N	2	2	2025-09-25 07:02:51.862934	2025-09-25 07:02:51.862934	f	\N	\N	0	\N	f	\N
4	66	14	ASSIGNED	MEDIUM	2025-09-30 05:00:00	\N	\N	\N	2	2	2025-09-25 07:18:15.170904	2025-09-25 07:18:15.170904	f	\N	\N	0	\N	f	\N
6	68	17	SUBMITTED_TO_QA	MEDIUM	2025-10-03 05:00:00	\N	\N	\N	2	2	2025-09-25 10:11:22.544907	2025-09-25 12:24:16.125681	f	\N	\N	0	\N	f	\N
5	67	17	SUBMITTED_TO_QA	HIGH	2025-10-03 05:00:00	\N	\N	\N	2	2	2025-09-25 10:08:18.857861	2025-09-25 16:33:51.708513	f	\N	\N	0	\N	f	\N
8	70	17	REVISIONS_REQUIRED	MEDIUM	2025-10-03 05:00:00	\N	\N	\N	2	2	2025-09-25 10:55:47.645408	2025-09-26 10:08:07.740407	f	\N	\N	0	\N	f	\N
11	73	18	ASSIGNED	CRITICAL	2025-10-02 05:00:00	\N	\N	\N	2	2	2025-09-27 14:37:33.582288	2025-09-27 14:37:33.582288	f	\N	\N	0	\N	f	\N
12	74	18	SUBMITTED_TO_QA	CRITICAL	2025-10-22 05:00:00	\N	\N	\N	2	2	2025-09-30 09:32:57.321423	2025-09-30 09:35:19.877943	f	\N	\N	0	\N	f	\N
15	77	18	COMPLETED	HIGH	2025-10-15 05:00:00	\N	2025-10-01 12:20:09.513651	\N	2	2	2025-10-01 05:47:26.776777	2025-10-01 12:20:09.513651	t	2025-10-01 12:20:09.513651	26	0		f	\N
13	75	18	COMPLETED	MEDIUM	2025-10-02 05:00:00	\N	2025-10-01 12:20:34.447802	\N	2	2	2025-09-30 10:05:43.50958	2025-10-01 12:20:34.447802	t	2025-10-01 12:20:34.447802	26	0		f	\N
10	72	18	COMPLETED	MEDIUM	2025-09-30 05:00:00	\N	2025-10-01 12:20:36.854329	\N	2	2	2025-09-27 08:11:35.102032	2025-10-01 12:20:36.854329	t	2025-10-01 12:20:36.854329	26	0		f	\N
9	71	17	COMPLETED	MEDIUM	2025-10-02 05:00:00	\N	2025-10-01 12:20:38.377657	\N	2	2	2025-09-25 17:46:32.049406	2025-10-01 12:20:38.377657	t	2025-10-01 12:20:38.377657	26	0		f	\N
7	69	17	COMPLETED	CRITICAL	2025-10-02 05:00:00	\N	2025-10-02 04:42:29.376672	\N	2	2	2025-09-25 10:36:02.109176	2025-10-02 04:42:29.376672	t	2025-10-02 04:42:29.376672	26	0		f	\N
16	78	18	ASSIGNED	MEDIUM	2025-10-10 05:00:00	\N	\N	\N	2	2	2025-10-03 06:43:45.214079	2025-10-03 06:43:45.214079	f	\N	\N	0	\N	f	\N
17	79	20	ASSIGNED	MEDIUM	2025-10-15 05:00:00	\N	\N	\N	2	2	2025-10-08 07:32:34.339083	2025-10-08 07:32:34.339083	f	\N	\N	0	\N	f	\N
18	80	20	ASSIGNED	MEDIUM	2025-11-11 00:00:00	\N	\N	\N	2	2	2025-11-03 08:26:07.19749	2025-11-03 08:26:07.19749	f	\N	\N	0	\N	f	\N
20	82	17	REVISIONS_REQUIRED	LOW	2025-11-21 00:00:00	\N	\N	\N	2	2	2025-11-04 08:03:39.686663	2025-11-04 08:34:28.67714	f	\N	\N	0	\N	f	\N
19	81	17	COMPLETED	CRITICAL	2025-11-05 00:00:00	\N	2025-11-04 09:18:51.160974	\N	2	2	2025-11-03 12:50:28.738243	2025-11-04 09:18:51.160974	t	2025-11-04 09:18:51.160974	34	0		f	\N
14	76	18	COMPLETED	MEDIUM	2025-10-08 05:00:00	\N	2025-11-04 09:29:45.100252	\N	2	2	2025-10-01 03:59:11.992845	2025-11-04 09:29:45.100252	t	2025-11-04 09:29:45.100252	34	0		f	\N
\.


--
-- Data for Name: process_sequences; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.process_sequences (id, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
1	Label Production	Standard label production sequence	t	2025-09-14 10:17:09.196	2025-09-14 10:17:09.196
4	Heat Transfer Label Production	Heat transfer label production workflow	t	2025-09-14 10:24:16.196	2025-09-14 10:24:16.196
9	Digital Printing Production	Digital printing production workflow	t	2025-09-14 10:24:16.2	2025-09-14 10:24:16.2
3	Box Manufacturing	Cardboard box production sequence	t	2025-09-14 10:17:09.196	2025-09-14 10:17:09.196
5	PFL Production	Printed fabric label production workflow	t	2025-09-14 10:24:16.197	2025-09-14 10:24:16.197
6	Offset Printing Production	Complete offset printing production workflow with all departments	t	2025-09-14 10:24:16.196	2025-09-14 10:24:16.196
7	Woven Label Production	Woven label production workflow	t	2025-09-14 10:24:16.197	2025-09-14 10:24:16.197
8	Leather Patch Production	Leather patch production workflow	t	2025-09-14 10:24:16.2	2025-09-14 10:24:16.2
2	Business Card Printing	Business card production sequence	t	2025-09-14 10:17:09.196	2025-09-14 10:17:09.196
\.


--
-- Data for Name: process_steps; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.process_steps (id, "sequenceId", "stepNumber", name, description, "estimatedDuration", "isQualityCheck", "isActive", "createdAt", "updatedAt", process_sequence_id) FROM stdin;
1	1	1	Design Review	Review and approve label design	30	t	t	2025-09-14 10:17:09.785	2025-09-14 10:17:09.785	\N
5	1	6	Packaging	Package finished labels	15	f	t	2025-09-14 10:17:09.794	2025-09-14 10:17:09.794	\N
3	1	3	Printing	Print labels on material	45	f	t	2025-09-14 10:17:09.788	2025-09-14 10:17:09.788	\N
4	1	4	Die Cutting	Cut labels to final shape	20	f	t	2025-09-14 10:17:09.792	2025-09-14 10:17:09.792	\N
6	1	5	Quality Check	Final quality inspection	10	t	t	2025-09-14 10:17:09.792	2025-09-14 10:17:09.792	\N
7	6	1	Prepress	File preparation and proofing	2	t	t	2025-09-14 10:24:16.285	2025-09-14 10:24:16.285	\N
8	6	2	Material Procurement	Source and procure printing materials	1	f	t	2025-09-14 10:24:16.296	2025-09-14 10:24:16.296	\N
9	6	3	Material Issuance	Issue materials to production floor	0	f	t	2025-09-14 10:24:16.306	2025-09-14 10:24:16.306	\N
10	6	4	Paper Cutting	Cut paper to required dimensions	1	f	t	2025-09-14 10:24:16.31	2025-09-14 10:24:16.31	\N
11	6	5	Offset Printing	Main offset printing process	4	f	t	2025-09-14 10:24:16.314	2025-09-14 10:24:16.314	\N
12	6	6	Digital Printing	Digital printing for small runs or details	2	f	t	2025-09-14 10:24:16.318	2025-09-14 10:24:16.318	\N
13	6	7	Varnish Matt	Apply matt varnish coating	1	f	t	2025-09-14 10:24:16.331	2025-09-14 10:24:16.331	\N
14	6	8	Varnish Gloss	Apply gloss varnish coating	1	f	t	2025-09-14 10:24:16.368	2025-09-14 10:24:16.368	\N
15	6	9	Varnish Soft Touch	Apply soft touch varnish	2	f	t	2025-09-14 10:24:16.375	2025-09-14 10:24:16.375	\N
16	6	10	Inlay Pasting	Paste inlay materials	1	f	t	2025-09-14 10:24:16.409	2025-09-14 10:24:16.409	\N
17	6	11	Lamination Matte	Apply matte lamination	1	f	t	2025-09-14 10:24:16.415	2025-09-14 10:24:16.415	\N
18	6	12	Lamination Gloss	Apply gloss lamination	1	f	t	2025-09-14 10:24:16.422	2025-09-14 10:24:16.422	\N
19	6	13	Lamination Soft Touch	Apply soft touch lamination	2	f	t	2025-09-14 10:24:16.432	2025-09-14 10:24:16.432	\N
20	6	14	UV Coating	Apply UV protective coating	1	f	t	2025-09-14 10:24:16.436	2025-09-14 10:24:16.436	\N
21	6	15	Foil Matte	Apply matte foil stamping	2	f	t	2025-09-14 10:24:16.45	2025-09-14 10:24:16.45	\N
22	6	16	Foil Gloss	Apply gloss foil stamping	2	f	t	2025-09-14 10:24:16.456	2025-09-14 10:24:16.456	\N
23	6	17	Screen Printing	Screen printing overlay process	3	f	t	2025-09-14 10:24:16.46	2025-09-14 10:24:16.46	\N
24	6	18	Embossing	Embossing process for raised effect	2	f	t	2025-09-14 10:24:16.466	2025-09-14 10:24:16.466	\N
25	6	19	Debossing	Debossing process for depressed effect	2	f	t	2025-09-14 10:24:16.472	2025-09-14 10:24:16.472	\N
26	6	20	Pasting	General pasting operations	1	f	t	2025-09-14 10:24:16.509	2025-09-14 10:24:16.509	\N
27	6	21	Two Way Tape	Apply two-way adhesive tape	0	f	t	2025-09-14 10:24:16.531	2025-09-14 10:24:16.531	\N
28	6	22	Die Cutting	Die cutting to final shape	2	f	t	2025-09-14 10:24:16.556	2025-09-14 10:24:16.556	\N
29	6	23	Breaking	Breaking/separation process	1	f	t	2025-09-14 10:24:16.561	2025-09-14 10:24:16.561	\N
30	6	24	Piggy Sticker	Apply piggy back stickers	0	f	t	2025-09-14 10:24:16.566	2025-09-14 10:24:16.566	\N
31	6	25	RFID	RFID tag application	1	f	t	2025-09-14 10:24:16.575	2025-09-14 10:24:16.575	\N
32	6	26	Eyelet	Eyelet insertion	0	f	t	2025-09-14 10:24:16.606	2025-09-14 10:24:16.606	\N
33	6	27	Out Source	External outsourced processes	8	f	t	2025-09-14 10:24:16.651	2025-09-14 10:24:16.651	\N
34	6	28	Packing	Final packaging process	1	f	t	2025-09-14 10:24:16.706	2025-09-14 10:24:16.706	\N
35	6	29	Ready	Quality check and ready status	0	t	t	2025-09-14 10:24:16.749	2025-09-14 10:24:16.749	\N
36	6	30	Dispatch	Dispatch to customer	0	f	t	2025-09-14 10:24:16.789	2025-09-14 10:24:16.789	\N
37	6	31	Excess	Handle excess materials/wastage	0	f	t	2025-09-14 10:24:16.834	2025-09-14 10:24:16.834	\N
38	4	1	Prepress	Heat transfer design preparation	1	t	t	2025-09-14 10:24:16.917	2025-09-14 10:24:16.917	\N
39	4	2	Material Procurement	Source heat transfer materials	1	f	t	2025-09-14 10:24:17.042	2025-09-14 10:24:17.042	\N
40	4	3	Material Issuance	Issue heat transfer materials	0	f	t	2025-09-14 10:24:17.108	2025-09-14 10:24:17.108	\N
41	4	4	Exposing	Expose heat transfer film	2	f	t	2025-09-14 10:24:17.159	2025-09-14 10:24:17.159	\N
42	4	5	Printing	Print heat transfer design	3	f	t	2025-09-14 10:24:17.17	2025-09-14 10:24:17.17	\N
43	4	6	Die Cutting	Die cut heat transfer labels	1	f	t	2025-09-14 10:24:17.216	2025-09-14 10:24:17.216	\N
44	4	7	Breaking	Break/separate labels	1	f	t	2025-09-14 10:24:17.302	2025-09-14 10:24:17.302	\N
45	4	8	Packing	Pack heat transfer labels	1	f	t	2025-09-14 10:24:17.317	2025-09-14 10:24:17.317	\N
46	4	9	Ready	Ready for dispatch	0	t	t	2025-09-14 10:24:17.389	2025-09-14 10:24:17.389	\N
47	4	10	Dispatch	Dispatch heat transfer labels	0	f	t	2025-09-14 10:24:17.539	2025-09-14 10:24:17.539	\N
48	4	11	Excess	Handle excess materials	0	f	t	2025-09-14 10:24:17.562	2025-09-14 10:24:17.562	\N
49	5	1	Prepress	PFL design preparation	1	t	t	2025-09-14 10:24:17.84	2025-09-14 10:24:17.84	\N
50	5	2	Material Procurement	Source PFL materials	1	f	t	2025-09-14 10:24:17.959	2025-09-14 10:24:17.959	\N
51	5	3	Material Issuance	Issue PFL materials	0	f	t	2025-09-14 10:24:18.054	2025-09-14 10:24:18.054	\N
52	5	4	Block Making	Create printing blocks	3	f	t	2025-09-14 10:24:18.146	2025-09-14 10:24:18.146	\N
53	5	5	Printing	Print film labels	4	f	t	2025-09-14 10:24:18.252	2025-09-14 10:24:18.252	\N
54	5	6	RFID	Apply RFID to PFL	1	f	t	2025-09-14 10:24:18.274	2025-09-14 10:24:18.274	\N
55	5	7	Cut & Fold	Cut and fold PFL	2	f	t	2025-09-14 10:24:18.489	2025-09-14 10:24:18.489	\N
56	5	8	Curing	Cure printed labels	4	f	t	2025-09-14 10:24:18.537	2025-09-14 10:24:18.537	\N
57	5	9	Packing	Pack PFL products	1	f	t	2025-09-14 10:24:18.605	2025-09-14 10:24:18.605	\N
58	5	10	Ready	Ready for dispatch	0	t	t	2025-09-14 10:24:18.644	2025-09-14 10:24:18.644	\N
59	5	11	Dispatch	Dispatch PFL products	0	f	t	2025-09-14 10:24:18.707	2025-09-14 10:24:18.707	\N
60	5	12	Excess	Handle excess materials	0	f	t	2025-09-14 10:24:18.788	2025-09-14 10:24:18.788	\N
61	7	1	Prepress	Woven label design preparation	2	t	t	2025-09-14 10:24:18.85	2025-09-14 10:24:18.85	\N
62	7	2	Material Procurement	Source woven materials	1	f	t	2025-09-14 10:24:18.947	2025-09-14 10:24:18.947	\N
63	7	3	Material Issuance	Issue woven materials	0	f	t	2025-09-14 10:24:19.092	2025-09-14 10:24:19.092	\N
64	7	4	Dyeing	Dye woven materials	6	f	t	2025-09-14 10:24:19.306	2025-09-14 10:24:19.306	\N
65	7	5	Printing	Print on fabric before weaving	3	f	t	2025-09-14 10:24:19.423	2025-09-14 10:24:19.423	\N
66	7	6	Weaving	Weave label fabric	8	f	t	2025-09-14 10:24:19.606	2025-09-14 10:24:19.606	\N
67	7	7	Screen Printing	Screen print on woven labels	3	f	t	2025-09-14 10:24:19.808	2025-09-14 10:24:19.808	\N
68	7	8	Slitting	Slit woven labels	2	f	t	2025-09-14 10:24:19.855	2025-09-14 10:24:19.855	\N
69	7	9	RFID	Apply RFID to woven labels	1	f	t	2025-09-14 10:24:19.865	2025-09-14 10:24:19.865	\N
70	7	10	Cut & Fold	Cut and fold woven labels	2	f	t	2025-09-14 10:24:20.067	2025-09-14 10:24:20.067	\N
71	7	11	Packing	Pack woven labels	1	f	t	2025-09-14 10:24:20.326	2025-09-14 10:24:20.326	\N
72	7	12	Ready	Ready for dispatch	0	t	t	2025-09-14 10:24:20.385	2025-09-14 10:24:20.385	\N
73	7	13	Dispatch	Dispatch woven labels	0	f	t	2025-09-14 10:24:20.546	2025-09-14 10:24:20.546	\N
74	7	14	Excess	Handle excess materials	0	f	t	2025-09-14 10:24:20.715	2025-09-14 10:24:20.715	\N
75	8	1	Prepress	Leather patch design preparation	1	t	t	2025-09-14 10:24:20.837	2025-09-14 10:24:20.837	\N
76	8	2	Material Procurement	Source leather materials	1	f	t	2025-09-14 10:24:20.886	2025-09-14 10:24:20.886	\N
77	8	3	Material Issuance	Issue leather materials	0	f	t	2025-09-14 10:24:21.06	2025-09-14 10:24:21.06	\N
78	8	4	Printing	Print on leather patches	3	f	t	2025-09-14 10:24:21.318	2025-09-14 10:24:21.318	\N
79	8	5	RFID	Apply RFID to leather patches	1	f	t	2025-09-14 10:24:21.427	2025-09-14 10:24:21.427	\N
80	8	6	Ready	Ready leather patches	0	t	t	2025-09-14 10:24:23.841	2025-09-14 10:24:23.841	\N
81	8	7	Dispatch	Dispatch leather patches	0	f	t	2025-09-14 10:24:24.303	2025-09-14 10:24:24.303	\N
82	8	8	Excess	Handle excess materials	0	f	t	2025-09-14 10:24:24.461	2025-09-14 10:24:24.461	\N
83	9	1	Prepress	Digital printing file preparation	1	t	t	2025-09-14 10:24:24.581	2025-09-14 10:24:24.581	\N
84	9	2	Material Procurement	Source digital printing materials	1	f	t	2025-09-14 10:24:24.672	2025-09-14 10:24:24.672	\N
85	9	3	Material Issuance	Issue digital printing materials	0	f	t	2025-09-14 10:24:24.817	2025-09-14 10:24:24.817	\N
86	9	4	Block Making	Create digital blocks if needed	2	f	t	2025-09-14 10:24:24.913	2025-09-14 10:24:24.913	\N
87	9	5	Printing	Digital printing process	2	f	t	2025-09-14 10:24:24.964	2025-09-14 10:24:24.964	\N
88	9	6	Offset Printing	Hybrid offset printing	3	f	t	2025-09-14 10:24:25.116	2025-09-14 10:24:25.116	\N
89	9	7	Die Cutting	Die cut digital products	1	f	t	2025-09-14 10:24:25.343	2025-09-14 10:24:25.343	\N
90	9	8	Breaking	Break/separate products	1	f	t	2025-09-14 10:24:25.567	2025-09-14 10:24:25.567	\N
91	9	9	Packing	Pack digital products	1	f	t	2025-09-14 10:24:27.52	2025-09-14 10:24:27.52	\N
92	9	10	Ready	Ready for dispatch	0	t	t	2025-09-14 10:24:27.614	2025-09-14 10:24:27.614	\N
93	9	11	Dispatch	Dispatch digital products	0	f	t	2025-09-14 10:24:27.806	2025-09-14 10:24:27.806	\N
94	9	12	Excess	Handle excess materials	0	f	t	2025-09-14 10:24:28.063	2025-09-14 10:24:28.063	\N
2	1	2	Material Preparation	Prepare label material and setup	15	f	t	2025-09-14 10:17:09.786	2025-09-14 10:17:09.786	\N
\.


--
-- Data for Name: procurement_report_config; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.procurement_report_config (config_id, report_name, report_type, config_data, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_process_selections; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.product_process_selections (id, "productId", "sequenceId", "isDefault", "createdAt") FROM stdin;
2	4	6	t	2025-09-14 10:24:29.962
3	6	7	t	2025-09-14 10:24:29.965
4	9	6	t	2025-09-14 10:28:39.995
5	10	6	t	2025-09-14 10:28:40.101
6	11	6	t	2025-09-14 10:28:40.321
7	12	6	t	2025-09-14 10:28:40.532
8	13	6	t	2025-09-14 10:28:40.714
9	14	6	t	2025-09-14 10:28:42.571
10	15	6	t	2025-09-14 10:28:42.741
11	16	6	t	2025-09-14 10:28:42.808
12	17	6	t	2025-09-14 10:28:42.871
13	18	6	t	2025-09-14 10:28:42.904
14	19	6	t	2025-09-14 10:28:42.93
15	20	6	t	2025-09-14 10:28:42.986
16	21	6	t	2025-09-14 10:28:43.007
17	22	6	t	2025-09-14 10:28:43.308
18	23	6	t	2025-09-14 10:28:43.336
19	24	6	t	2025-09-14 10:28:43.503
20	25	6	t	2025-09-14 10:28:43.67
21	7	6	t	2025-09-14 10:28:43.733
22	26	6	t	2025-09-14 10:28:43.939
23	27	6	t	2025-09-14 10:28:44.294
24	28	6	t	2025-09-14 10:28:44.525
25	29	6	t	2025-09-14 10:28:44.585
26	30	6	t	2025-09-14 10:28:44.761
27	41	6	t	2025-09-14 10:28:44.803
28	42	6	t	2025-09-14 10:28:44.912
29	43	6	t	2025-09-14 10:28:44.981
30	44	6	t	2025-09-14 10:28:45.014
31	45	6	t	2025-09-14 10:28:45.074
32	51	4	t	2025-09-14 10:28:45.123
33	52	4	t	2025-09-14 10:28:45.266
34	53	4	t	2025-09-14 10:28:45.387
35	54	4	t	2025-09-14 10:28:45.45
36	55	4	t	2025-09-14 10:28:45.506
37	8	5	t	2025-09-14 10:28:45.574
38	31	5	t	2025-09-14 10:28:45.588
39	32	5	t	2025-09-14 10:28:45.659
40	33	5	t	2025-09-14 10:28:45.687
41	34	5	t	2025-09-14 10:28:45.703
42	35	5	t	2025-09-14 10:28:45.715
43	36	5	t	2025-09-14 10:28:45.73
44	37	5	t	2025-09-14 10:28:45.829
45	38	5	t	2025-09-14 10:28:45.877
46	39	5	t	2025-09-14 10:28:45.89
47	40	5	t	2025-09-14 10:28:45.904
48	46	7	t	2025-09-14 10:28:45.943
49	47	7	t	2025-09-14 10:28:46.056
50	48	7	t	2025-09-14 10:28:46.116
51	49	7	t	2025-09-14 10:28:46.211
52	50	7	t	2025-09-14 10:28:46.227
53	56	8	t	2025-09-14 10:28:46.259
54	57	8	t	2025-09-14 10:28:46.273
55	58	8	t	2025-09-14 10:28:46.366
56	59	8	t	2025-09-14 10:28:46.424
57	60	8	t	2025-09-14 10:28:46.535
1	5	6	t	2025-09-14 10:24:29.962
\.


--
-- Data for Name: product_step_selections; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.product_step_selections (id, "productId", "stepId", is_selected, "createdAt", "updatedAt") FROM stdin;
1	72	7	t	2025-09-16 05:13:34.88733	2025-09-16 05:13:34.88733
2	72	8	t	2025-09-16 05:13:35.109355	2025-09-16 05:13:35.109355
3	72	35	t	2025-09-16 05:13:35.228389	2025-09-16 05:13:35.228389
4	73	7	t	2025-09-16 05:16:16.365146	2025-09-16 05:16:16.365146
5	73	35	t	2025-09-16 05:16:16.399571	2025-09-16 05:16:16.399571
6	74	7	t	2025-09-16 05:17:26.397971	2025-09-16 05:17:26.397971
7	74	8	t	2025-09-16 05:17:26.429156	2025-09-16 05:17:26.429156
8	74	9	t	2025-09-16 05:17:26.449645	2025-09-16 05:17:26.449645
9	74	35	t	2025-09-16 05:17:26.545492	2025-09-16 05:17:26.545492
10	75	75	t	2025-09-16 09:38:13.321849	2025-09-16 09:38:13.321849
11	75	79	t	2025-09-16 09:38:13.534222	2025-09-16 09:38:13.534222
12	75	80	t	2025-09-16 09:38:13.646182	2025-09-16 09:38:13.646182
13	75	81	t	2025-09-16 09:38:13.665405	2025-09-16 09:38:13.665405
14	76	7	t	2025-09-16 09:44:34.374384	2025-09-16 09:44:34.374384
15	76	21	t	2025-09-16 09:44:34.391769	2025-09-16 09:44:34.391769
16	76	24	t	2025-09-16 09:44:34.721904	2025-09-16 09:44:34.721904
17	76	35	t	2025-09-16 09:44:34.733862	2025-09-16 09:44:34.733862
18	77	7	t	2025-09-18 06:28:51.405277	2025-09-18 06:28:51.405277
19	77	9	t	2025-09-18 06:28:51.421845	2025-09-18 06:28:51.421845
20	77	10	t	2025-09-18 06:28:51.427709	2025-09-18 06:28:51.427709
21	77	35	t	2025-09-18 06:28:51.433337	2025-09-18 06:28:51.433337
22	78	7	t	2025-09-19 11:06:06.036652	2025-09-19 11:06:06.036652
23	78	8	t	2025-09-19 11:06:06.376961	2025-09-19 11:06:06.376961
24	78	9	t	2025-09-19 11:06:06.429431	2025-09-19 11:06:06.429431
25	78	10	t	2025-09-19 11:06:06.496197	2025-09-19 11:06:06.496197
26	78	11	t	2025-09-19 11:06:06.551676	2025-09-19 11:06:06.551676
27	78	12	t	2025-09-19 11:06:06.579169	2025-09-19 11:06:06.579169
28	78	35	t	2025-09-19 11:06:06.594039	2025-09-19 11:06:06.594039
29	79	7	t	2025-09-19 11:38:38.666459	2025-09-19 11:38:38.666459
30	79	8	t	2025-09-19 11:38:38.756469	2025-09-19 11:38:38.756469
31	79	9	t	2025-09-19 11:38:38.774722	2025-09-19 11:38:38.774722
32	79	10	t	2025-09-19 11:38:38.800626	2025-09-19 11:38:38.800626
33	79	11	t	2025-09-19 11:38:38.891622	2025-09-19 11:38:38.891622
34	79	35	t	2025-09-19 11:38:38.913239	2025-09-19 11:38:38.913239
35	80	7	t	2025-09-23 10:30:48.961946	2025-09-23 10:30:48.961946
36	80	10	t	2025-09-23 10:30:48.975718	2025-09-23 10:30:48.975718
37	80	11	t	2025-09-23 10:30:48.98682	2025-09-23 10:30:48.98682
38	80	12	t	2025-09-23 10:30:48.996701	2025-09-23 10:30:48.996701
39	80	14	t	2025-09-23 10:30:49.033139	2025-09-23 10:30:49.033139
40	80	35	t	2025-09-23 10:30:49.060181	2025-09-23 10:30:49.060181
41	81	7	t	2025-09-23 11:32:45.027039	2025-09-23 11:32:45.027039
42	81	8	t	2025-09-23 11:32:45.302669	2025-09-23 11:32:45.302669
43	81	9	t	2025-09-23 11:32:45.500138	2025-09-23 11:32:45.500138
44	81	10	t	2025-09-23 11:32:45.538433	2025-09-23 11:32:45.538433
45	81	35	t	2025-09-23 11:32:45.83553	2025-09-23 11:32:45.83553
46	82	7	t	2025-09-25 05:05:34.804678	2025-09-25 05:05:34.804678
47	82	8	t	2025-09-25 05:05:35.085636	2025-09-25 05:05:35.085636
48	82	9	t	2025-09-25 05:05:35.112687	2025-09-25 05:05:35.112687
49	82	35	t	2025-09-25 05:05:35.204144	2025-09-25 05:05:35.204144
50	83	7	t	2025-09-27 08:09:10.413258	2025-09-27 08:09:10.413258
51	83	35	t	2025-09-27 08:09:10.542131	2025-09-27 08:09:10.542131
52	84	7	t	2025-09-27 12:53:49.233669	2025-09-27 12:53:49.233669
53	84	8	t	2025-09-27 12:53:49.30506	2025-09-27 12:53:49.30506
54	84	9	t	2025-09-27 12:53:49.316105	2025-09-27 12:53:49.316105
55	84	35	t	2025-09-27 12:53:49.349539	2025-09-27 12:53:49.349539
56	85	7	t	2025-09-27 13:11:02.92775	2025-09-27 13:11:02.92775
57	85	8	t	2025-09-27 13:11:03.137628	2025-09-27 13:11:03.137628
58	85	9	t	2025-09-27 13:11:03.282873	2025-09-27 13:11:03.282873
59	85	35	t	2025-09-27 13:11:03.421851	2025-09-27 13:11:03.421851
60	86	49	t	2025-09-30 09:31:07.540874	2025-09-30 09:31:07.540874
61	86	50	t	2025-09-30 09:31:07.551968	2025-09-30 09:31:07.551968
62	86	51	t	2025-09-30 09:31:07.557248	2025-09-30 09:31:07.557248
63	86	52	t	2025-09-30 09:31:07.564728	2025-09-30 09:31:07.564728
64	86	58	t	2025-09-30 09:31:07.5742	2025-09-30 09:31:07.5742
65	87	7	t	2025-10-03 06:36:49.155791	2025-10-03 06:36:49.155791
66	87	8	t	2025-10-03 06:36:49.172441	2025-10-03 06:36:49.172441
67	87	9	t	2025-10-03 06:36:49.179373	2025-10-03 06:36:49.179373
68	87	35	t	2025-10-03 06:36:49.184801	2025-10-03 06:36:49.184801
69	88	61	t	2025-10-08 07:29:01.257014	2025-10-08 07:29:01.257014
70	88	63	t	2025-10-08 07:29:01.323214	2025-10-08 07:29:01.323214
71	88	64	t	2025-10-08 07:29:01.338432	2025-10-08 07:29:01.338432
72	88	66	t	2025-10-08 07:29:01.346855	2025-10-08 07:29:01.346855
73	88	70	t	2025-10-08 07:29:01.357213	2025-10-08 07:29:01.357213
74	88	71	t	2025-10-08 07:29:01.40726	2025-10-08 07:29:01.40726
75	88	72	t	2025-10-08 07:29:01.41363	2025-10-08 07:29:01.41363
76	88	73	t	2025-10-08 07:29:01.425248	2025-10-08 07:29:01.425248
77	89	7	t	2025-10-13 07:15:54.387986	2025-10-13 07:15:54.387986
78	89	8	t	2025-10-13 07:15:54.577617	2025-10-13 07:15:54.577617
79	89	9	t	2025-10-13 07:15:54.58379	2025-10-13 07:15:54.58379
80	89	10	t	2025-10-13 07:15:54.598396	2025-10-13 07:15:54.598396
81	89	18	t	2025-10-13 07:15:54.626083	2025-10-13 07:15:54.626083
82	89	35	t	2025-10-13 07:15:54.632971	2025-10-13 07:15:54.632971
83	90	7	t	2025-11-03 08:25:05.022934	2025-11-03 08:25:05.022934
84	90	8	t	2025-11-03 08:25:05.024779	2025-11-03 08:25:05.024779
85	90	9	t	2025-11-03 08:25:05.025813	2025-11-03 08:25:05.025813
86	90	35	t	2025-11-03 08:25:05.027202	2025-11-03 08:25:05.027202
87	91	7	t	2025-11-03 12:31:48.909916	2025-11-03 12:31:48.909916
88	91	8	t	2025-11-03 12:31:48.911932	2025-11-03 12:31:48.911932
89	91	9	t	2025-11-03 12:31:48.91297	2025-11-03 12:31:48.91297
90	91	10	t	2025-11-03 12:31:48.913974	2025-11-03 12:31:48.913974
91	91	11	t	2025-11-03 12:31:48.915208	2025-11-03 12:31:48.915208
92	91	12	t	2025-11-03 12:31:48.9162	2025-11-03 12:31:48.9162
93	91	16	t	2025-11-03 12:31:48.917148	2025-11-03 12:31:48.917148
94	91	26	t	2025-11-03 12:31:48.918108	2025-11-03 12:31:48.918108
95	91	28	t	2025-11-03 12:31:48.91896	2025-11-03 12:31:48.91896
96	91	29	t	2025-11-03 12:31:48.919841	2025-11-03 12:31:48.919841
97	91	31	t	2025-11-03 12:31:48.920827	2025-11-03 12:31:48.920827
98	91	34	t	2025-11-03 12:31:48.921742	2025-11-03 12:31:48.921742
99	91	35	t	2025-11-03 12:31:48.922606	2025-11-03 12:31:48.922606
100	91	36	t	2025-11-03 12:31:48.92343	2025-11-03 12:31:48.92343
101	92	7	t	2025-11-04 07:15:17.941236	2025-11-04 07:15:17.941236
102	92	8	t	2025-11-04 07:15:17.942675	2025-11-04 07:15:17.942675
103	92	9	t	2025-11-04 07:15:17.943702	2025-11-04 07:15:17.943702
104	92	10	t	2025-11-04 07:15:17.944864	2025-11-04 07:15:17.944864
105	92	11	t	2025-11-04 07:15:17.945863	2025-11-04 07:15:17.945863
106	92	13	t	2025-11-04 07:15:17.946999	2025-11-04 07:15:17.946999
107	92	28	t	2025-11-04 07:15:17.947928	2025-11-04 07:15:17.947928
108	92	29	t	2025-11-04 07:15:17.948741	2025-11-04 07:15:17.948741
109	92	34	t	2025-11-04 07:15:17.949752	2025-11-04 07:15:17.949752
110	92	35	t	2025-11-04 07:15:17.950534	2025-11-04 07:15:17.950534
111	92	36	t	2025-11-04 07:15:17.951403	2025-11-04 07:15:17.951403
112	92	37	t	2025-11-04 07:15:17.952165	2025-11-04 07:15:17.952165
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.products (id, name, description, sku, "categoryId", brand, gsm, "fscCertified", "fscLicense", "basePrice", "isActive", "createdAt", "updatedAt", material_id) FROM stdin;
1	Product Label - Standard	Standard product label for retail items	LBL-001	3	ERP Labels	80	t	\N	0.250000000000000000000000000000	t	2025-09-14 10:17:07.48	2025-09-14 10:17:07.48	\N
2	Cardboard Box - Medium	Medium size cardboard packaging box	PKG-001	1	ERP Packaging	350	t	\N	1.500000000000000000000000000000	t	2025-09-14 10:17:07.493	2025-09-14 10:17:07.493	\N
3	Business Cards	Professional business cards	PRT-001	2	ERP Print	300	f	\N	0.100000000000000000000000000000	t	2025-09-14 10:17:07.495	2025-09-14 10:17:07.495	\N
4	Adidas Hang Tag - Standard	Standard hang tag for Adidas products	HT-002-ADIDAS	5	Adidas	250	t	\N	0.300000000000000000000000000000	t	2025-09-14 10:24:16.141	2025-09-14 10:24:16.141	\N
5	Nike Hang Tag - Premium	Premium hang tag for Nike products	HT-001-NIKE	5	Nike	300	t	\N	0.350000000000000000000000000000	t	2025-09-14 10:24:16.141	2025-09-14 10:24:16.141	\N
6	H&M Woven Brand Label	Woven brand label for H&M garments	WL-001-HM	10	H&M	\N	f	\N	0.450000000000000000000000000000	t	2025-09-14 10:24:16.148	2025-09-14 10:24:16.148	\N
7	Puma Price Tag	Price tag for Puma products	PT-001-PUMA	7	Puma	200	f	\N	0.200000000000000000000000000000	t	2025-09-14 10:24:16.147	2025-09-14 10:24:16.147	\N
8	Under Armour Care Label	Care instruction label for Under Armour	CL-001-UA	6	Under Armour	150	f	\N	0.150000000000000000000000000000	t	2025-09-14 10:24:16.149	2025-09-14 10:24:16.149	\N
9	Nike Air Max Hang Tag - Premium Black	Premium black hang tag for Nike Air Max series	HT-NIKE-AM-001	5	Nike	350	t	\N	0.450000000000000000000000000000	t	2025-09-14 10:28:25.353	2025-09-14 10:28:25.353	\N
10	Nike Jordan Hang Tag - Gold Foil	Gold foil hang tag for Jordan brand products	HT-NIKE-JD-002	5	Nike	300	t	\N	0.650000000000000000000000000000	t	2025-09-14 10:28:25.64	2025-09-14 10:28:25.64	\N
11	Nike Sportswear Hang Tag - Standard	Standard hang tag for Nike sportswear	HT-NIKE-SW-003	5	Nike	250	t	\N	0.350000000000000000000000000000	t	2025-09-14 10:28:25.674	2025-09-14 10:28:25.674	\N
12	Nike Kids Hang Tag - Colorful	Colorful hang tag for Nike kids collection	HT-NIKE-KD-004	5	Nike	200	t	\N	0.300000000000000000000000000000	t	2025-09-14 10:28:25.764	2025-09-14 10:28:25.764	\N
13	Adidas Originals Hang Tag - Black	Classic black hang tag for Adidas Originals	HT-ADIDAS-OR-001	5	Adidas	300	t	\N	0.400000000000000000000000000000	t	2025-09-14 10:28:25.898	2025-09-14 10:28:25.898	\N
14	Adidas Performance Hang Tag - Blue	Blue performance hang tag for Adidas sports	HT-ADIDAS-PF-002	5	Adidas	280	t	\N	0.380000000000000000000000000000	t	2025-09-14 10:28:26.043	2025-09-14 10:28:26.043	\N
15	Adidas Y-3 Hang Tag - Luxury	Luxury hang tag for Adidas Y-3 collection	HT-ADIDAS-Y3-003	5	Adidas	400	t	\N	0.750000000000000000000000000000	t	2025-09-14 10:28:26.166	2025-09-14 10:28:26.166	\N
16	Adidas Neo Hang Tag - Youth	Youth-oriented hang tag for Adidas Neo	HT-ADIDAS-NE-004	5	Adidas	220	t	\N	0.280000000000000000000000000000	t	2025-09-14 10:28:26.3	2025-09-14 10:28:26.3	\N
17	Puma Suede Hang Tag - Classic	Classic hang tag for Puma Suede collection	HT-PUMA-SD-001	5	Puma	320	t	\N	0.420000000000000000000000000000	t	2025-09-14 10:28:26.352	2025-09-14 10:28:26.352	\N
18	Puma RS Hang Tag - Tech	Tech-style hang tag for Puma RS series	HT-PUMA-RS-002	5	Puma	290	t	\N	0.390000000000000000000000000000	t	2025-09-14 10:28:26.376	2025-09-14 10:28:26.376	\N
19	Puma Motorsport Hang Tag - Racing	Racing-themed hang tag for Puma Motorsport	HT-PUMA-MS-003	5	Puma	350	t	\N	0.480000000000000000000000000000	t	2025-09-14 10:28:26.454	2025-09-14 10:28:26.454	\N
20	Under Armour HeatGear Hang Tag	HeatGear technology hang tag	HT-UA-HG-001	5	Under Armour	280	t	\N	0.360000000000000000000000000000	t	2025-09-14 10:28:26.564	2025-09-14 10:28:26.564	\N
21	Under Armour ColdGear Hang Tag	ColdGear technology hang tag	HT-UA-CG-002	5	Under Armour	300	t	\N	0.380000000000000000000000000000	t	2025-09-14 10:28:26.624	2025-09-14 10:28:26.624	\N
22	Under Armour Curry Hang Tag - Signature	Signature hang tag for Curry collection	HT-UA-CU-003	5	Under Armour	350	t	\N	0.500000000000000000000000000000	t	2025-09-14 10:28:26.775	2025-09-14 10:28:26.775	\N
23	H&M Basic Hang Tag - Minimalist	Minimalist hang tag for H&M basics	HT-HM-BC-001	5	H&M	200	t	\N	0.250000000000000000000000000000	t	2025-09-14 10:28:26.861	2025-09-14 10:28:26.861	\N
24	H&M Premium Hang Tag - Sustainable	Sustainable hang tag for H&M premium	HT-HM-PR-002	5	H&M	250	t	\N	0.320000000000000000000000000000	t	2025-09-14 10:28:26.954	2025-09-14 10:28:26.954	\N
25	H&M Kids Hang Tag - Fun Design	Fun design hang tag for H&M kids	HT-HM-KD-003	5	H&M	180	t	\N	0.220000000000000000000000000000	t	2025-09-14 10:28:27.043	2025-09-14 10:28:27.043	\N
26	Nike Price Tag - Retail Standard	Standard retail price tag for Nike products	PT-NIKE-RS-001	7	Nike	200	f	\N	0.180000000000000000000000000000	t	2025-09-14 10:28:27.28	2025-09-14 10:28:27.28	\N
27	Adidas Price Tag - Outlet	Outlet price tag for Adidas	PT-ADIDAS-OT-001	7	Adidas	180	f	\N	0.150000000000000000000000000000	t	2025-09-14 10:28:27.369	2025-09-14 10:28:27.369	\N
28	Puma Price Tag - Premium	Premium price tag for Puma	PT-PUMA-PR-001	7	Puma	220	t	\N	0.220000000000000000000000000000	t	2025-09-14 10:28:27.577	2025-09-14 10:28:27.577	\N
29	Under Armour Price Tag - Sport	Sport price tag for Under Armour	PT-UA-SP-001	7	Under Armour	200	f	\N	0.200000000000000000000000000000	t	2025-09-14 10:28:27.649	2025-09-14 10:28:27.649	\N
30	H&M Price Tag - Fashion	Fashion price tag for H&M	PT-HM-FS-001	7	H&M	160	t	\N	0.120000000000000000000000000000	t	2025-09-14 10:28:27.905	2025-09-14 10:28:27.905	\N
31	Nike Care Label - Sportswear	Care instructions for Nike sportswear	CL-NIKE-SW-001	6	Nike	120	f	\N	0.080000000000000000000000000000	t	2025-09-14 10:28:28.015	2025-09-14 10:28:28.015	\N
32	Adidas Care Label - Performance	Care instructions for Adidas performance wear	CL-ADIDAS-PF-001	6	Adidas	130	f	\N	0.090000000000000000000000000000	t	2025-09-14 10:28:28.106	2025-09-14 10:28:28.106	\N
33	Puma Care Label - Lifestyle	Care instructions for Puma lifestyle	CL-PUMA-LS-001	6	Puma	125	f	\N	0.080000000000000000000000000000	t	2025-09-14 10:28:28.161	2025-09-14 10:28:28.161	\N
34	Under Armour Care Label - Tech	Care instructions for UA tech fabrics	CL-UA-TC-001	6	Under Armour	140	f	\N	0.100000000000000000000000000000	t	2025-09-14 10:28:28.258	2025-09-14 10:28:28.258	\N
35	H&M Care Label - Cotton	Care instructions for H&M cotton garments	CL-HM-CT-001	6	H&M	110	t	\N	0.060000000000000000000000000000	t	2025-09-14 10:28:28.521	2025-09-14 10:28:28.521	\N
36	Nike Size Label - Footwear	Size label for Nike footwear	SL-NIKE-FW-001	9	Nike	150	f	\N	0.120000000000000000000000000000	t	2025-09-14 10:28:29.021	2025-09-14 10:28:29.021	\N
37	Adidas Size Label - Apparel	Size label for Adidas apparel	SL-ADIDAS-AP-001	9	Adidas	140	f	\N	0.110000000000000000000000000000	t	2025-09-14 10:28:29.093	2025-09-14 10:28:29.093	\N
38	Puma Size Label - Accessories	Size label for Puma accessories	SL-PUMA-AC-001	9	Puma	130	f	\N	0.100000000000000000000000000000	t	2025-09-14 10:28:29.194	2025-09-14 10:28:29.194	\N
39	Under Armour Size Label - Performance	Size label for UA performance gear	SL-UA-PF-001	9	Under Armour	160	f	\N	0.130000000000000000000000000000	t	2025-09-14 10:28:29.291	2025-09-14 10:28:29.291	\N
40	H&M Size Label - International	International size label for H&M	SL-HM-IN-001	9	H&M	120	t	\N	0.090000000000000000000000000000	t	2025-09-14 10:28:29.342	2025-09-14 10:28:29.342	\N
41	Nike Swoosh Brand Label - Embossed	Embossed Nike Swoosh brand label	BL-NIKE-SW-001	8	Nike	300	t	\N	0.450000000000000000000000000000	t	2025-09-14 10:28:29.682	2025-09-14 10:28:29.682	\N
42	Adidas Three Stripes Brand Label	Three stripes Adidas brand label	BL-ADIDAS-3S-001	8	Adidas	280	t	\N	0.420000000000000000000000000000	t	2025-09-14 10:28:30.043	2025-09-14 10:28:30.043	\N
43	Puma Cat Logo Brand Label	Puma cat logo brand label	BL-PUMA-CAT-001	8	Puma	270	t	\N	0.400000000000000000000000000000	t	2025-09-14 10:28:32.776	2025-09-14 10:28:32.776	\N
44	Under Armour UA Brand Label	Under Armour UA brand label	BL-UA-UA-001	8	Under Armour	290	t	\N	0.430000000000000000000000000000	t	2025-09-14 10:28:33.28	2025-09-14 10:28:33.28	\N
45	H&M Brand Label - Minimalist	Minimalist H&M brand label	BL-HM-MIN-001	8	H&M	200	t	\N	0.280000000000000000000000000000	t	2025-09-14 10:28:33.911	2025-09-14 10:28:33.911	\N
46	Nike Woven Label - Premium Cotton	Premium cotton woven label for Nike	WL-NIKE-PC-001	10	Nike	\N	f	\N	0.650000000000000000000000000000	t	2025-09-14 10:28:34.132	2025-09-14 10:28:34.132	\N
47	Adidas Woven Label - Recycled Poly	Recycled polyester woven label for Adidas	WL-ADIDAS-RP-001	10	Adidas	\N	t	\N	0.700000000000000000000000000000	t	2025-09-14 10:28:34.483	2025-09-14 10:28:34.483	\N
48	Puma Woven Label - Satin Finish	Satin finish woven label for Puma	WL-PUMA-SF-001	10	Puma	\N	f	\N	0.680000000000000000000000000000	t	2025-09-14 10:28:35.021	2025-09-14 10:28:35.021	\N
49	Under Armour Woven Label - Tech Fiber	Tech fiber woven label for Under Armour	WL-UA-TF-001	10	Under Armour	\N	f	\N	0.750000000000000000000000000000	t	2025-09-14 10:28:35.219	2025-09-14 10:28:35.219	\N
50	H&M Woven Label - Organic Cotton	Organic cotton woven label for H&M	WL-HM-OC-001	10	H&M	\N	t	\N	0.550000000000000000000000000000	t	2025-09-14 10:28:35.506	2025-09-14 10:28:35.506	\N
51	Nike Heat Transfer Label - Reflective	Reflective heat transfer label for Nike	HTL-NIKE-RF-001	12	Nike	\N	f	\N	0.850000000000000000000000000000	t	2025-09-14 10:28:35.717	2025-09-14 10:28:35.717	\N
52	Adidas Heat Transfer Label - 3D Effect	3D effect heat transfer label for Adidas	HTL-ADIDAS-3D-001	12	Adidas	\N	f	\N	0.900000000000000000000000000000	t	2025-09-14 10:28:35.837	2025-09-14 10:28:35.837	\N
53	Puma Heat Transfer Label - Glow	Glow-in-dark heat transfer label for Puma	HTL-PUMA-GL-001	12	Puma	\N	f	\N	0.880000000000000000000000000000	t	2025-09-14 10:28:35.996	2025-09-14 10:28:35.996	\N
54	Under Armour Heat Transfer Label - Metallic	Metallic heat transfer label for Under Armour	HTL-UA-MT-001	12	Under Armour	\N	f	\N	0.950000000000000000000000000000	t	2025-09-14 10:28:36.121	2025-09-14 10:28:36.121	\N
55	H&M Heat Transfer Label - Eco-Friendly	Eco-friendly heat transfer label for H&M	HTL-HM-ECO-001	12	H&M	\N	t	\N	0.720000000000000000000000000000	t	2025-09-14 10:28:36.397	2025-09-14 10:28:36.397	\N
56	Nike Leather Patch - Vintage Brown	Vintage brown leather patch for Nike premium	LP-NIKE-VB-001	11	Nike	\N	f	\N	2.500000000000000000000000000000	t	2025-09-14 10:28:39.024	2025-09-14 10:28:39.024	\N
57	Adidas Leather Patch - Black Premium	Black premium leather patch for Adidas	LP-ADIDAS-BP-001	11	Adidas	\N	f	\N	2.750000000000000000000000000000	t	2025-09-14 10:28:39.224	2025-09-14 10:28:39.224	\N
58	Puma Leather Patch - Suede Finish	Suede finish leather patch for Puma	LP-PUMA-SF-001	11	Puma	\N	f	\N	2.850000000000000000000000000000	t	2025-09-14 10:28:39.339	2025-09-14 10:28:39.339	\N
59	Under Armour Leather Patch - Embossed	Embossed leather patch for Under Armour	LP-UA-EM-001	11	Under Armour	\N	f	\N	3.000000000000000000000000000000	t	2025-09-14 10:28:39.668	2025-09-14 10:28:39.668	\N
60	H&M Leather Patch - Sustainable	Sustainable leather patch for H&M	LP-HM-SUS-001	11	H&M	\N	t	\N	2.250000000000000000000000000000	t	2025-09-14 10:28:39.821	2025-09-14 10:28:39.821	\N
63	TEST-001	Test product description	TEST-001	1	Test Brand	250	f	\N	0.000000000000000000000000000000	t	2025-09-15 05:18:38.357	2025-09-15 05:18:38.357	\N
64	BR-00-122-A		BR-00-122-A	1	GAP	51	t	Recycled	0.000000000000000000000000000000	t	2025-09-15 08:22:21.08	2025-09-15 08:22:21.08	\N
65	BR-00-139-Z		BR-00-139-Z	1	JCP	50	t	Recycled	0.000000000000000000000000000000	t	2025-09-15 09:17:33.629	2025-09-15 09:17:33.629	\N
66	BR-00-123-A		BR-00-123-A	1	GAP	300	t	Recycled	0.000000000000000000000000000000	t	2025-09-15 09:59:25.866	2025-09-15 09:59:25.866	\N
67	BR-00-124-C		BR-00-124-C	1	BASS PRO SHOPS	50	t	Mixed	0.000000000000000000000000000000	t	2025-09-15 10:22:26.962	2025-09-15 10:22:26.962	\N
68	BR-00-123-C		BR-00-123-C	1	BIG STAR	540	t	Mixed	0.000000000000000000000000000000	t	2025-09-15 10:35:47.075	2025-09-15 10:35:47.075	\N
69	BR-00-123-F		BR-00-123-F	1	Aprel	43	t	Mixed	0.000000000000000000000000000000	t	2025-09-15 11:14:00.516	2025-09-15 11:14:00.516	\N
70	BR-00-123-N		BR-00-123-N	1	BERSHKA	50	t	Recycled	0.000000000000000000000000000000	t	2025-09-15 12:05:33.175	2025-09-15 12:05:33.175	\N
71	BR-00-123-D		BR-00-123-D	1	47 HANGTAG	50	t	Recycled	0.000000000000000000000000000000	t	2025-09-15 12:38:21.662	2025-09-15 12:38:21.662	\N
72	BR-00-123-B		BR-00-123-B	1	ALCOTT	50	t	Recycled	0.000000000000000000000000000000	t	2025-09-16 04:59:19.164	2025-09-16 04:59:19.164	\N
73	BR-00-123-E		BR-00-123-E	1	Aeropostale	50	t	Recycled	0.000000000000000000000000000000	t	2025-09-16 05:16:16.31	2025-09-16 05:16:16.31	\N
74	BR-00-143-A		BR-00-143-A	1	47 HANGTAG	400	t	Recycled	0.000000000000000000000000000000	t	2025-09-16 05:17:26.233	2025-09-16 05:17:26.233	85
75	BR-00-156-F		BR-00-156-F	1	ZARA	130	t	Recycled	0.000000000000000000000000000000	t	2025-09-16 09:38:13.208	2025-09-16 09:38:13.208	\N
76	BR-00-279-F		BR-00-279-F	1	BERSHKA	350	t	Recycled	0.000000000000000000000000000000	t	2025-09-16 09:44:34.3	2025-09-16 09:44:34.3	\N
77	BR-00-145-B		BR-00-145-B	1	AEO	51	t	Mixed	0.000000000000000000000000000000	t	2025-09-18 06:28:51.317	2025-09-18 06:28:51.317	\N
78	BR-12-123-A		BR-12-123-A	1	AEO	52	t	Mixed	0.000000000000000000000000000000	t	2025-09-19 11:06:05.665	2025-09-19 11:12:34.839	48
79	BA-00-123-A		BA-00-123-A	1	ALCOTT	64	t	Recycled	0.000000000000000000000000000000	t	2025-09-19 11:38:38.535	2025-09-19 11:38:38.535	48
80	BR-00-129-A		BR-00-129-A	1	AHLENS	280	f	\N	0.000000000000000000000000000000	t	2025-09-23 10:30:48.725	2025-09-23 10:30:48.725	\N
81	PB-00-111-A		PB-00-111-A	1	PULL & BEAR	350	t	Mixed	0.000000000000000000000000000000	t	2025-09-23 11:32:38.398	2025-09-23 11:32:38.398	\N
82	BR-00-298-A		BR-00-298-A	1	MITCHELL	250	t	Mixed	0.000000000000000000000000000000	t	2025-09-25 05:05:33.538	2025-09-25 05:05:33.538	48
83	BR-00-156-Z		BR-00-156-Z	1	ALCOTT	350	t	Recycled	0.000000000000000000000000000000	t	2025-09-27 08:09:04.066	2025-09-27 08:09:04.066	\N
84	BR-00-129-D		BR-00-129-D	1	BASS PRO SHOPS	450	t	Mixed	0.000000000000000000000000000000	t	2025-09-27 12:53:49.034	2025-09-27 12:53:49.034	39
85	BR-00-183-E		BR-00-183-E	1	AHLENS	580	t	Mixed	0.000000000000000000000000000000	t	2025-09-27 13:11:02.878	2025-09-27 13:11:02.878	46
86	BR-00-132-A		BR-00-132-A	1	BERSHKA	50	t	Recycled	0.000000000000000000000000000000	t	2025-09-30 09:31:07.299	2025-09-30 09:31:07.299	46
87	Pull&Bear123		Pull&Bear123	1	PULL & BEAR	1100	t	Mixed	0.000000000000000000000000000000	t	2025-10-03 06:36:49.086	2025-10-03 06:36:49.086	76
88	Wide leg		Wide leg	1	NEXT	25	t	Mixed	0.000000000000000000000000000000	t	2025-10-08 07:29:00.777	2025-10-08 07:29:00.777	70
89	BR-00-123		BR-00-123	1	BERNE	500	t	Mixed	0.000000000000000000000000000000	t	2025-10-13 07:15:53.785	2025-10-13 07:15:53.785	68
90	Next New Wide Label 1		Next New Wide Label 1	1	ASOS/TOPSHOP	26	t	Mixed	0.000000000000000000000000000000	t	2025-11-03 08:25:04.96	2025-11-03 08:25:04.96	45
91	RFIDTK_V2		RFIDTK_V2	1	AEO	200	t	Mixed	0.000000000000000000000000000000	t	2025-11-03 12:31:48.867	2025-11-03 12:31:48.867	45
92	SPFW-SS26-FT16		SPFW-SS26-FT16	1	SPRINGFIELD	350	t	Mixed	0.000000000000000000000000000000	t	2025-11-04 07:15:17.648	2025-11-04 07:15:17.648	49
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.purchase_order_items (po_item_id, po_id, item_id, quantity_ordered, quantity_received, unit, unit_price, total_price, specifications, expected_delivery_date, created_at) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.purchase_orders (po_id, po_number, supplier_id, requisition_id, po_date, expected_delivery_date, actual_delivery_date, status, subtotal, tax_amount, discount_amount, total_amount, currency, payment_terms, shipping_address, billing_address, notes, created_by, approved_by, approved_at, created_at, updated_at) FROM stdin;
1	PO-2024-001	1	1	2025-10-06	2025-10-13	\N	SENT	1000.00	0.00	0.00	1000.00	USD	\N	\N	\N	\N	system	\N	\N	2025-10-06 12:03:51.581954	2025-10-06 12:03:51.581954
\.


--
-- Data for Name: purchase_requisition_items; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.purchase_requisition_items (requisition_item_id, requisition_id, item_id, quantity, unit, estimated_unit_price, estimated_total_price, specifications, required_date, created_at) FROM stdin;
\.


--
-- Data for Name: purchase_requisitions; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.purchase_requisitions (requisition_id, requisition_number, requested_by, department, requisition_date, required_date, priority, status, total_estimated_cost, justification, approved_by, approved_at, created_at, updated_at) FROM stdin;
1	REQ-2024-001	John Doe	Production	2025-10-06	\N	HIGH	SUBMITTED	0.00	Urgent requirement for production materials	\N	\N	2025-10-06 12:03:51.539975	2025-10-06 12:03:51.539975
\.


--
-- Data for Name: ratio_reports; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.ratio_reports (id, job_card_id, excel_file_link, excel_file_name, factory_name, po_number, job_number, brand_name, item_name, report_date, total_ups, total_sheets, total_plates, qty_produced, excess_qty, efficiency_percentage, excess_percentage, required_order_qty, color_details, plate_distribution, color_efficiency, raw_excel_data, created_at, created_by, updated_at) FROM stdin;
1	74	https://drive.google.com/file/d/sample-ratio-excel-1759224765817/view	Ratio_Report.xlsx		P0321	JC-1759224776885	BERSHKA	BR-00-132-A	2025-09-30	\N	250	4	\N	\N	100.00	\N	\N	[{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]	{"A": {"colors": ["DK JET 20PS", "MED HARVEST 22WS", "DK JET 20P"], "sheets": 50, "totalUPS": 18}, "B": {"colors": ["DK JET 2PS", "LT AQUAMARINE 26WS", "MED HARVEST 20WS"], "sheets": 100, "totalUPS": 18}, "C": {"colors": ["DK JET 18PS", "MED HARVEST 24WS"], "sheets": 50, "totalUPS": 18}, "D": {"colors": ["MED HARVEST 20WL"], "sheets": 50, "totalUPS": 18}}	{"DK JET 20P": {"excessQty": 0, "efficiency": 100}, "DK JET 2PS": {"excessQty": 0, "efficiency": 100}, "DK JET 18PS": {"excessQty": 0, "efficiency": 100}, "DK JET 20PS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WL": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 22WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 24WS": {"excessQty": 0, "efficiency": 100}, "LT AQUAMARINE 26WS": {"excessQty": 0, "efficiency": 100}}	{"summary": {"totalUPS": 18, "excessQty": 0, "efficiency": 100, "qtyProduced": 4500, "totalPlates": 4, "totalSheets": 250, "excessPercent": 0, "requiredOrderQty": 4500}, "orderInfo": {"po": "Unknown", "job": "Unknown", "date": "2025-09-30T09:32:43.114Z", "item": "Unknown", "brand": "Unknown", "factory": "Unknown"}, "colorDetails": [{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]}	2025-09-30 09:32:57.262831	2	2025-09-30 09:32:57.262831
2	75	https://drive.google.com/file/d/sample-ratio-excel-1759226738884/view	Ratio_Report.xlsx		P0321	JC-1759226742860	BERSHKA	BR-00-132-A	2025-09-30	\N	250	4	\N	\N	100.00	\N	\N	[{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]	{"A": {"colors": ["DK JET 20PS", "MED HARVEST 22WS", "DK JET 20P"], "sheets": 50, "totalUPS": 18}, "B": {"colors": ["DK JET 2PS", "LT AQUAMARINE 26WS", "MED HARVEST 20WS"], "sheets": 100, "totalUPS": 18}, "C": {"colors": ["DK JET 18PS", "MED HARVEST 24WS"], "sheets": 50, "totalUPS": 18}, "D": {"colors": ["MED HARVEST 20WL"], "sheets": 50, "totalUPS": 18}}	{"DK JET 20P": {"excessQty": 0, "efficiency": 100}, "DK JET 2PS": {"excessQty": 0, "efficiency": 100}, "DK JET 18PS": {"excessQty": 0, "efficiency": 100}, "DK JET 20PS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WL": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 22WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 24WS": {"excessQty": 0, "efficiency": 100}, "LT AQUAMARINE 26WS": {"excessQty": 0, "efficiency": 100}}	{"summary": {"totalUPS": 18, "excessQty": 0, "efficiency": 100, "qtyProduced": 4500, "totalPlates": 4, "totalSheets": 250, "excessPercent": 0, "requiredOrderQty": 4500}, "orderInfo": {"po": "Unknown", "job": "Unknown", "date": "2025-09-30T10:03:40.028Z", "item": "Unknown", "brand": "Unknown", "factory": "Unknown"}, "colorDetails": [{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]}	2025-09-30 10:05:43.440545	2	2025-09-30 10:05:43.440545
3	76	https://drive.google.com/file/d/sample-ratio-excel-1759291095149/view	Ratio_Report.xlsx		P0321	JC-1759291151339	BERSHKA	BR-00-132-A	2025-10-01	\N	250	4	\N	\N	100.00	\N	\N	[{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]	{"A": {"colors": ["DK JET 20PS", "MED HARVEST 22WS", "DK JET 20P"], "sheets": 50, "totalUPS": 18}, "B": {"colors": ["DK JET 2PS", "LT AQUAMARINE 26WS", "MED HARVEST 20WS"], "sheets": 100, "totalUPS": 18}, "C": {"colors": ["DK JET 18PS", "MED HARVEST 24WS"], "sheets": 50, "totalUPS": 18}, "D": {"colors": ["MED HARVEST 20WL"], "sheets": 50, "totalUPS": 18}}	{"DK JET 20P": {"excessQty": 0, "efficiency": 100}, "DK JET 2PS": {"excessQty": 0, "efficiency": 100}, "DK JET 18PS": {"excessQty": 0, "efficiency": 100}, "DK JET 20PS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WL": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 22WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 24WS": {"excessQty": 0, "efficiency": 100}, "LT AQUAMARINE 26WS": {"excessQty": 0, "efficiency": 100}}	{"summary": {"totalUPS": 18, "excessQty": 0, "efficiency": 100, "qtyProduced": 4500, "totalPlates": 4, "totalSheets": 250, "excessPercent": 0, "requiredOrderQty": 4500}, "orderInfo": {"po": "Unknown", "job": "Unknown", "date": "2025-10-01T03:58:10.308Z", "item": "Unknown", "brand": "Unknown", "factory": "Unknown"}, "colorDetails": [{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]}	2025-10-01 03:59:11.898175	2	2025-10-01 03:59:11.898175
4	77	https://drive.google.com/file/d/sample-ratio-excel-1759297598133/view	Ratio_Report.xlsx		Po345	JC-1759297646118	BERSHKA	BR-00-132-A	2025-10-01	\N	9	4	\N	9	94.44	5.56	\N	[{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 5, "excessQty": 2, "qtyProduced": 10, "requiredQty": 8}, {"ups": 4, "size": "2PS", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 3, "qtyProduced": 20, "requiredQty": 17}, {"ups": 4, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 20, "requiredQty": 20}, {"ups": 4, "size": "26WS", "color": "LT AQUAMARINE", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 20, "requiredQty": 20}, {"ups": 4, "size": "20WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 20, "requiredQty": 20}, {"ups": 7, "size": "22WS", "color": "MED HARVEST", "plate": "B", "sheets": 2, "excessQty": 2, "qtyProduced": 14, "requiredQty": 12}, {"ups": 11, "size": "20WL", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 1, "qtyProduced": 22, "requiredQty": 21}, {"ups": 18, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 1, "excessQty": 1, "qtyProduced": 18, "requiredQty": 17}, {"ups": 18, "size": "24WS", "color": "MED HARVEST", "plate": "D", "sheets": 1, "excessQty": 0, "qtyProduced": 18, "requiredQty": 18}]	{"A": {"colors": ["DK JET 20PS", "DK JET 2PS", "DK JET 20P", "LT AQUAMARINE 26WS", "MED HARVEST 20WS"], "sheets": 5, "totalUPS": 18}, "B": {"colors": ["MED HARVEST 22WS", "MED HARVEST 20WL"], "sheets": 2, "totalUPS": 18}, "C": {"colors": ["DK JET 18PS"], "sheets": 1, "totalUPS": 18}, "D": {"colors": ["MED HARVEST 24WS"], "sheets": 1, "totalUPS": 18}}	{"DK JET 20P": {"excessQty": 0, "efficiency": 100}, "DK JET 2PS": {"excessQty": 3, "efficiency": 85}, "DK JET 18PS": {"excessQty": 1, "efficiency": 94.44444444444444}, "DK JET 20PS": {"excessQty": 2, "efficiency": 80}, "MED HARVEST 20WL": {"excessQty": 1, "efficiency": 95.45454545454545}, "MED HARVEST 20WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 22WS": {"excessQty": 2, "efficiency": 85.71428571428571}, "MED HARVEST 24WS": {"excessQty": 0, "efficiency": 100}, "LT AQUAMARINE 26WS": {"excessQty": 0, "efficiency": 100}}	{"summary": {"totalUPS": 18, "excessQty": 9, "efficiency": 94.44444444444444, "qtyProduced": 162, "totalPlates": 4, "totalSheets": 9, "excessPercent": 5.56, "requiredOrderQty": 153}, "orderInfo": {"po": "Unknown", "job": "Unknown", "date": "2025-10-01T05:46:22.008Z", "item": "Unknown", "brand": "Unknown", "factory": "Unknown"}, "colorDetails": [{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 5, "excessQty": 2, "qtyProduced": 10, "requiredQty": 8}, {"ups": 4, "size": "2PS", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 3, "qtyProduced": 20, "requiredQty": 17}, {"ups": 4, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 20, "requiredQty": 20}, {"ups": 4, "size": "26WS", "color": "LT AQUAMARINE", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 20, "requiredQty": 20}, {"ups": 4, "size": "20WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 20, "requiredQty": 20}, {"ups": 7, "size": "22WS", "color": "MED HARVEST", "plate": "B", "sheets": 2, "excessQty": 2, "qtyProduced": 14, "requiredQty": 12}, {"ups": 11, "size": "20WL", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 1, "qtyProduced": 22, "requiredQty": 21}, {"ups": 18, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 1, "excessQty": 1, "qtyProduced": 18, "requiredQty": 17}, {"ups": 18, "size": "24WS", "color": "MED HARVEST", "plate": "D", "sheets": 1, "excessQty": 0, "qtyProduced": 18, "requiredQty": 18}]}	2025-10-01 05:47:26.610521	2	2025-10-01 05:47:26.610521
5	78	https://drive.google.com/file/d/sample-ratio-excel-1759473729353/view	Ratio_Report.xlsx		PO#1981	JC-1759473825689	PULL & BEAR	Pull&Bear123	2025-10-03	18	250	4	4500	\N	100.00	\N	4500	[{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]	{"A": {"colors": ["DK JET 20PS", "MED HARVEST 22WS", "DK JET 20P"], "sheets": 50, "totalUPS": 18}, "B": {"colors": ["DK JET 2PS", "LT AQUAMARINE 26WS", "MED HARVEST 20WS"], "sheets": 100, "totalUPS": 18}, "C": {"colors": ["DK JET 18PS", "MED HARVEST 24WS"], "sheets": 50, "totalUPS": 18}, "D": {"colors": ["MED HARVEST 20WL"], "sheets": 50, "totalUPS": 18}}	{"DK JET 20P": {"excessQty": 0, "efficiency": 100}, "DK JET 2PS": {"excessQty": 0, "efficiency": 100}, "DK JET 18PS": {"excessQty": 0, "efficiency": 100}, "DK JET 20PS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WL": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 22WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 24WS": {"excessQty": 0, "efficiency": 100}, "LT AQUAMARINE 26WS": {"excessQty": 0, "efficiency": 100}}	{"summary": {"totalUPS": 18, "excessQty": 0, "efficiency": 100, "qtyProduced": 4500, "totalPlates": 4, "totalSheets": 250, "excessPercent": 0, "requiredOrderQty": 4500}, "orderInfo": {"po": "Unknown", "job": "Unknown", "date": "2025-10-03T06:40:29.931Z", "item": "Unknown", "brand": "Unknown", "factory": "Unknown"}, "colorDetails": [{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]}	2025-10-03 06:43:45.129851	2	2025-10-03 06:43:45.129851
6	79	https://drive.google.com/file/d/sample-ratio-excel-1759908734417/view	Ratio_Report.xlsx		166880	JC-1759908753911	NEXT	Wide leg	2025-10-08	18	250	4	4500	\N	100.00	\N	4500	[{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]	{"A": {"colors": ["DK JET 20PS", "MED HARVEST 22WS", "DK JET 20P"], "sheets": 50, "totalUPS": 18}, "B": {"colors": ["DK JET 2PS", "LT AQUAMARINE 26WS", "MED HARVEST 20WS"], "sheets": 100, "totalUPS": 18}, "C": {"colors": ["DK JET 18PS", "MED HARVEST 24WS"], "sheets": 50, "totalUPS": 18}, "D": {"colors": ["MED HARVEST 20WL"], "sheets": 50, "totalUPS": 18}}	{"DK JET 20P": {"excessQty": 0, "efficiency": 100}, "DK JET 2PS": {"excessQty": 0, "efficiency": 100}, "DK JET 18PS": {"excessQty": 0, "efficiency": 100}, "DK JET 20PS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WL": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 20WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 22WS": {"excessQty": 0, "efficiency": 100}, "MED HARVEST 24WS": {"excessQty": 0, "efficiency": 100}, "LT AQUAMARINE 26WS": {"excessQty": 0, "efficiency": 100}}	{"summary": {"totalUPS": 18, "excessQty": 0, "efficiency": 100, "qtyProduced": 4500, "totalPlates": 4, "totalSheets": 250, "excessPercent": 0, "requiredOrderQty": 4500}, "orderInfo": {"po": "Unknown", "job": "Unknown", "date": "2025-10-08T07:32:04.410Z", "item": "Unknown", "brand": "Unknown", "factory": "Unknown"}, "colorDetails": [{"ups": 2, "size": "20PS", "color": "DK JET", "plate": "A", "sheets": 50, "excessQty": 0, "qtyProduced": 100, "requiredQty": 100}, {"ups": 4, "size": "22WS", "color": "MED HARVEST", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 200, "requiredQty": 200}, {"ups": 12, "size": "20P", "color": "DK JET", "plate": "A", "sheets": 0, "excessQty": 0, "qtyProduced": 600, "requiredQty": 600}, {"ups": 3, "size": "2PS", "color": "DK JET", "plate": "B", "sheets": 100, "excessQty": 0, "qtyProduced": 300, "requiredQty": 300}, {"ups": 7, "size": "26WS", "color": "LT AQUAMARINE", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 700, "requiredQty": 700}, {"ups": 8, "size": "20WS", "color": "MED HARVEST", "plate": "B", "sheets": 0, "excessQty": 0, "qtyProduced": 800, "requiredQty": 800}, {"ups": 8, "size": "18PS", "color": "DK JET", "plate": "C", "sheets": 50, "excessQty": 0, "qtyProduced": 400, "requiredQty": 400}, {"ups": 10, "size": "24WS", "color": "MED HARVEST", "plate": "C", "sheets": 0, "excessQty": 0, "qtyProduced": 500, "requiredQty": 500}, {"ups": 18, "size": "20WL", "color": "MED HARVEST", "plate": "D", "sheets": 50, "excessQty": 0, "qtyProduced": 900, "requiredQty": 900}]}	2025-10-08 07:32:33.867989	2	2025-10-08 07:32:33.867989
7	81	https://drive.google.com/file/d/sample-ratio-excel-1762174212246/view	Ratio_Report.xlsx		NR10/0403/25	JC-1762174261187	AEO	RFIDTK_V2	2025-11-03	40	22	2	880	49	94.43	5.57	831	[{"ups": 2830, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0001", "sheets": 55, "excessQty": 4, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 2832, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0002", "sheets": 25, "excessQty": 2, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3030, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0005", "sheets": 72, "excessQty": 6, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3034, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0007", "sheets": 25, "excessQty": 2, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3230, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0008", "sheets": 94, "excessQty": 7, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3232, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0009", "sheets": 95, "excessQty": 7, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3432, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0012", "sheets": 70, "excessQty": 5, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3434, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0013", "sheets": 40, "excessQty": 3, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3632, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0015", "sheets": 52, "excessQty": 4, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 2930, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0003", "sheets": 44, "excessQty": 6, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 2932, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0004", "sheets": 30, "excessQty": 4, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3032, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0006", "sheets": 62, "excessQty": 8, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3234, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0010", "sheets": 45, "excessQty": 6, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3430, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0011", "sheets": 72, "excessQty": 9, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3630, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0014", "sheets": 50, "excessQty": 7, "qtyProduced": 0, "requiredQty": 517638245}]	{"S476-0001": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 55, "totalUPS": 2830}, "S476-0002": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 25, "totalUPS": 2832}, "S476-0003": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 44, "totalUPS": 2930}, "S476-0004": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 30, "totalUPS": 2932}, "S476-0005": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 72, "totalUPS": 3030}, "S476-0006": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 62, "totalUPS": 3032}, "S476-0007": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 25, "totalUPS": 3034}, "S476-0008": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 94, "totalUPS": 3230}, "S476-0009": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 95, "totalUPS": 3232}, "S476-0010": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 45, "totalUPS": 3234}, "S476-0011": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 72, "totalUPS": 3430}, "S476-0012": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 70, "totalUPS": 3432}, "S476-0013": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 40, "totalUPS": 3434}, "S476-0014": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 50, "totalUPS": 3630}, "S476-0015": {"colors": ["RFIDTK_V2 1284046_v2"], "sheets": 52, "totalUPS": 3632}}	{"RFIDTK_V2 1284046_v2": {"excessQty": 7, "efficiency": 0}}	{"summary": {"totalUPS": 40, "excessQty": 49, "efficiency": 94.43181818181819, "qtyProduced": 880, "totalPlates": 2, "totalSheets": 22, "excessPercent": 5.57, "requiredOrderQty": 831}, "orderInfo": {"po": "Unknown", "job": "Unknown", "date": "2025-11-03T12:49:53.419Z", "item": "Unknown", "brand": "Unknown", "factory": "Unknown"}, "colorDetails": [{"ups": 2830, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0001", "sheets": 55, "excessQty": 4, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 2832, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0002", "sheets": 25, "excessQty": 2, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3030, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0005", "sheets": 72, "excessQty": 6, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3034, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0007", "sheets": 25, "excessQty": 2, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3230, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0008", "sheets": 94, "excessQty": 7, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3232, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0009", "sheets": 95, "excessQty": 7, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3432, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0012", "sheets": 70, "excessQty": 5, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3434, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0013", "sheets": 40, "excessQty": 3, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3632, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0015", "sheets": 52, "excessQty": 4, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 2930, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0003", "sheets": 44, "excessQty": 6, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 2932, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0004", "sheets": 30, "excessQty": 4, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3032, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0006", "sheets": 62, "excessQty": 8, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3234, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0010", "sheets": 45, "excessQty": 6, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3430, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0011", "sheets": 72, "excessQty": 9, "qtyProduced": 0, "requiredQty": 517638245}, {"ups": 3630, "size": "1284046_v2", "color": "RFIDTK_V2", "plate": "S476-0014", "sheets": 50, "excessQty": 7, "qtyProduced": 0, "requiredQty": 517638245}]}	2025-11-03 12:50:28.703337	2	2025-11-03 12:50:28.703337
8	82	https://drive.google.com/file/d/sample-ratio-excel-1762243205031/view	Ratio_Report.xlsx		24101	JC-1762243451871	SPRINGFIELD	SPFW-SS26-FT16	2025-11-04	20	45	2	900	69	92.33	7.67	831	[{"ups": 2830, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0001", "sheets": 55, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 2932, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0004", "sheets": 30, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3230, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0008", "sheets": 94, "excessQty": 5, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3232, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0009", "sheets": 95, "excessQty": 5, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3434, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0013", "sheets": 40, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3632, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0015", "sheets": 52, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 2832, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0002", "sheets": 25, "excessQty": 1, "qtyProduced": 0, "requiredQty": 0}, {"ups": 2930, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0003", "sheets": 44, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3030, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0005", "sheets": 72, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3032, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0006", "sheets": 62, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3034, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0007", "sheets": 25, "excessQty": 1, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3234, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0010", "sheets": 45, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3430, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0011", "sheets": 72, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3432, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0012", "sheets": 70, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3630, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0014", "sheets": 50, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}]	{"S476-0001": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 55, "totalUPS": 2830}, "S476-0002": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 25, "totalUPS": 2832}, "S476-0003": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 44, "totalUPS": 2930}, "S476-0004": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 30, "totalUPS": 2932}, "S476-0005": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 72, "totalUPS": 3030}, "S476-0006": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 62, "totalUPS": 3032}, "S476-0007": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 25, "totalUPS": 3034}, "S476-0008": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 94, "totalUPS": 3230}, "S476-0009": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 95, "totalUPS": 3232}, "S476-0010": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 45, "totalUPS": 3234}, "S476-0011": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 72, "totalUPS": 3430}, "S476-0012": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 70, "totalUPS": 3432}, "S476-0013": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 40, "totalUPS": 3434}, "S476-0014": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 50, "totalUPS": 3630}, "S476-0015": {"colors": ["PUSH UP SPFW-SS26-FT16"], "sheets": 52, "totalUPS": 3632}}	{"PUSH UP SPFW-SS26-FT16": {"excessQty": 2, "efficiency": 0}}	{"summary": {"totalUPS": 20, "excessQty": 69, "efficiency": 92.33333333333333, "qtyProduced": 900, "totalPlates": 2, "totalSheets": 45, "excessPercent": 7.67, "requiredOrderQty": 831}, "orderInfo": {"po": "Unknown", "job": "Unknown", "date": "2025-11-04T07:57:46.873Z", "item": "Unknown", "brand": "Unknown", "factory": "Unknown"}, "colorDetails": [{"ups": 2830, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0001", "sheets": 55, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 2932, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0004", "sheets": 30, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3230, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0008", "sheets": 94, "excessQty": 5, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3232, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0009", "sheets": 95, "excessQty": 5, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3434, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0013", "sheets": 40, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3632, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0015", "sheets": 52, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 2832, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0002", "sheets": 25, "excessQty": 1, "qtyProduced": 0, "requiredQty": 0}, {"ups": 2930, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0003", "sheets": 44, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3030, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0005", "sheets": 72, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3032, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0006", "sheets": 62, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3034, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0007", "sheets": 25, "excessQty": 1, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3234, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0010", "sheets": 45, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3430, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0011", "sheets": 72, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3432, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0012", "sheets": 70, "excessQty": 3, "qtyProduced": 0, "requiredQty": 0}, {"ups": 3630, "size": "SPFW-SS26-FT16", "color": "PUSH UP", "plate": "S476-0014", "sheets": 50, "excessQty": 2, "qtyProduced": 0, "requiredQty": 0}]}	2025-11-04 08:03:39.561835	2	2025-11-04 08:03:39.561835
\.


--
-- Data for Name: supplier_items; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.supplier_items (supplier_item_id, supplier_id, item_id, supplier_item_code, supplier_item_name, unit_price, minimum_order_qty, lead_time_days, is_preferred, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.suppliers (supplier_id, supplier_code, supplier_name, contact_person, email, phone, address, city, state, country, postal_code, tax_id, payment_terms, credit_limit, currency, is_active, created_at, updated_at) FROM stdin;
1	SUP-001	Printing Supplies Co.	John Smith	john@printingsupplies.com	+1-555-0101	123 Industrial Ave	New York	NY	USA	\N	\N	Net 30	50000.00	USD	t	2025-10-06 12:03:48.583483	2025-10-06 12:03:48.583483
2	SUP-002	Ink & Chemical Solutions	Sarah Johnson	sarah@inkchemicals.com	+1-555-0102	456 Chemical Blvd	Los Angeles	CA	USA	\N	\N	Net 15	75000.00	USD	t	2025-10-06 12:03:48.583483	2025-10-06 12:03:48.583483
3	SUP-003	Paper & Board Suppliers	Mike Wilson	mike@paperboard.com	+1-555-0103	789 Paper Street	Chicago	IL	USA	\N	\N	Net 30	100000.00	USD	t	2025-10-06 12:03:48.583483	2025-10-06 12:03:48.583483
4	SUP-004	CTP Equipment & Materials	Lisa Brown	lisa@ctpequipment.com	+1-555-0104	321 Technology Dr	Houston	TX	USA	\N	\N	Net 45	25000.00	USD	t	2025-10-06 12:03:48.583483	2025-10-06 12:03:48.583483
5	SUP-005	Packaging Solutions Inc.	David Lee	david@packagingsolutions.com	+1-555-0105	654 Packaging Way	Phoenix	AZ	USA	\N	\N	Net 30	40000.00	USD	t	2025-10-06 12:03:48.583483	2025-10-06 12:03:48.583483
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.system_config (id, key, value, description, "isActive", "createdAt", "updatedAt") FROM stdin;
1	max_concurrent_jobs	50	Maximum concurrent job cards allowed	t	2025-09-14 10:17:10.431	2025-09-14 10:17:10.431
2	system_name	ERP Merchandiser System	System display name	t	2025-09-14 10:17:10.431	2025-09-14 10:17:10.431
3	default_currency	USD	Default system currency	t	2025-09-14 10:17:10.431	2025-09-14 10:17:10.431
4	production_departments	Offset,Heat Transfer,PFL,Woven,Leather,Digital	Available production departments	t	2025-09-14 10:24:30.041	2025-09-14 10:24:30.041
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.users (id, username, email, password, role, "firstName", "lastName", phone, "isActive", "lastLogin", "createdAt", "updatedAt") FROM stdin;
1	operator	operator@erp.local	$2b$10$LYQf/1lWrb.f5iX2MQHNkuJv//TOpDs7wAQgcCOj5WH1xE3cojLHC	OPERATOR	Machine	Operator	+1234567892	t	\N	2025-09-14 10:17:07.15	2025-09-14 10:17:07.15
3	manager	manager@erp.local	$2b$10$LYQf/1lWrb.f5iX2MQHNkuJv//TOpDs7wAQgcCOj5WH1xE3cojLHC	MANAGER	Production	Manager	+1234567891	t	\N	2025-09-14 10:17:07.15	2025-09-14 10:17:07.15
4	director	director@erp.local	$2b$10$5k7/.47ZZIUerjpp4kvTIeZXgr6Bqnp0ygODf//udTZqGTmq8XuCG	ADMIN	Production	Director	+1234567891	t	\N	2025-09-14 10:24:15.98	2025-09-14 10:24:15.98
5	productionhead	productionhead@erp.local	$2b$10$5k7/.47ZZIUerjpp4kvTIeZXgr6Bqnp0ygODf//udTZqGTmq8XuCG	PRODUCTION_HEAD	Production	Head	+1234567893	t	\N	2025-09-14 10:24:16.025	2025-09-14 10:24:16.025
6	operator1	operator1@erp.local	$2b$10$5k7/.47ZZIUerjpp4kvTIeZXgr6Bqnp0ygODf//udTZqGTmq8XuCG	OPERATOR	Machine	Operator	+1234567894	t	\N	2025-09-14 10:24:16.027	2025-09-14 10:24:16.027
8	designer_emma	emma.wilson@erp.local	$2b$10$DA3058NALUOTElWoxSZ0ROJ/ua9VzM.zDwzDMlEwsDrurg1xX18.W	DESIGNER	Emma	Wilson	+1234567893	t	\N	2025-09-19 17:44:39.375	2025-09-19 17:44:39.375
9	hod_alex	alex.kumar@erp.local	$2b$10$DJC0yGRV6KUeLJ3ktCGNwuxmwDwbh1WwJoqfKcu99bZ.4H/kbM/Oq	HOD_PREPRESS	Alex	Kumar	+1234567894	t	\N	2025-09-19 17:44:39.375	2025-09-19 17:44:39.375
10	merchandiser_sarah	sarah.chen@erp.local	$2b$10$jazDeY7HTSIorQzeR2LVSeTZ5g.N4YUZA0at0T5kQp8vDRvhCEN/G	MERCHANDISER	Sarah	Chen	+1234567895	t	\N	2025-09-19 17:44:39.375	2025-09-19 17:44:39.375
11	Kamran	kamran@horizonsourcing.net.pk	$2b$10$S/mKcI/zjpyD4pmxaN5hku13z7mmkU45uGQXWIqRdC2mLYe5HyKjW	HOD_PREPRESS	Kamran	hod	03457081490	t	\N	2025-09-19 13:20:57.03	2025-09-19 13:20:57.03
12	kamran.khan	kamran.khan@horizonsourcing.net.pk	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	HOD_PREPRESS	Kamran	Khan	\N	t	\N	2025-09-25 04:06:35.086	2025-09-25 04:06:35.086
14	taha.sharif	designing@horizonsourcing.net.pk	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	DESIGNER	Taha	Sharif	\N	t	\N	2025-09-25 04:06:35.086	2025-09-25 04:06:35.086
15	nabeel.hassan	designing1@horizonsourcing.net.pk	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	DESIGNER	Nabeel	Hassan	\N	t	\N	2025-09-25 04:06:35.086	2025-09-25 04:06:35.086
16	taha.saleem	Designing2@horizonsourcing.net.pk	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	DESIGNER	Taha	Saleem	\N	t	\N	2025-09-25 04:06:35.086	2025-09-25 04:06:35.086
18	uzair.ansari	designing4@horizonsourcing.net.pk	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	DESIGNER	Uzair	Ansari	\N	t	\N	2025-09-25 04:06:35.086	2025-09-25 04:06:35.086
19	shakeel.ahmed.rana	designing5@horizonsourcing.net.pk	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	DESIGNER	Shakeel Ahmed	Rana	\N	t	\N	2025-09-25 04:06:35.086	2025-09-25 04:06:35.086
20	muhammad.faizan	designing6@horizonsourcing.net.pk	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	DESIGNER	Muhammad	Faizan	\N	t	\N	2025-09-25 04:06:35.086	2025-09-25 04:06:35.086
22	qa.user	qa@horizonsourcing.net.pk	password	QA	QA	User	\N	t	\N	2025-09-25 12:01:00.985	2025-09-25 12:01:00.985
23	qa.prepress	qa.prepress@horizonsourcing.net.pk	$2b$10$3NVjpTkoHGmYZaT8WHxrneByaXljI0t5svBFY2Cy6TSwlzFpRSGUW	QA_PREPRESS	QA	Prepress	\N	t	\N	2025-09-25 12:05:27.645	2025-09-25 12:11:21.406
13	hammad.ahmed	hammad.ahmed@horizonsourcing.net.pk	$2b$10$IFk9jtOe8bEhGBxO07m3auYIERzDJOhhAvyEfeqrm91J5uADV4dCC	DESIGNER	Hammad	Ahmed	\N	t	\N	2025-09-25 04:06:35.086	2025-09-27 08:27:37.361
26	adnanctp	adnanctp@horizonsourcing.net.pk	$2a$10$LRrK6QcCK21fR5aiV4C3quxkHVQX5XZjiBK8SvamZIfsYU1qAIH9a	CTP_OPERATOR	Adnan	CTP	\N	t	\N	2025-10-01 11:08:47.208	2025-10-01 11:08:47.208
17	designing3	designing3@horizonsourcing.net.pk	$2a$10$tBEOHmJhDU28glFBelOq0e/Whe8khC5PQDkdyTaM5cUn2xOr.8CFa	DESIGNER	Designer	3	\N	t	\N	2025-09-25 04:06:35.086	2025-11-03 12:57:46.535
33	qaprepress	qa.prepress@horizonsourcing.com	$2a$10$ZVklF0HA66K8.5BGatOIteBTHLbe1sMjaOUt71oVyhAngfaOnwy4m	QA_PREPRESS	QA	Prepress	\N	t	\N	2025-11-03 12:55:35.066	2025-11-03 12:57:46.123
31	hodprepress	hod.prepress@horizonsourcing.com	$2a$10$8LKCNjlM0Mx2ZbzbgAOIKO7Pcp/wB27tADNNcdMLWB/4ZjV7elFC6	HOD_PREPRESS	HOD	Prepress	\N	t	\N	2025-11-03 12:55:34.871	2025-11-03 12:57:45.921
32	designer	designer@horizonsourcing.com	$2a$10$TXCTzZd3WPGic3ystSDpTOpdHDEajfp4BAxowBhPktV5lr4IyN.Y2	DESIGNER	Designer	User	\N	t	\N	2025-11-03 12:55:34.969	2025-11-03 12:57:46.023
34	ctpoperator	ctp.operator@horizonsourcing.com	$2a$10$QiGX3rMss1vOtCLRrm0orOjGbMPsOfLCQc865d71KIqoO3kzY8ROm	CTP_OPERATOR	CTP	Operator	\N	t	\N	2025-11-03 12:55:35.163	2025-11-03 12:57:46.232
27	inventorymanager	inventory.manager@horizonsourcing.com	$2a$10$N3d/OcaYeGk1HaN97gMjPONqpsG1ipTlqo8sIRtwqlSLSPf/cDNIe	INVENTORY_MANAGER	Inventory	Manager	\N	t	\N	2025-10-06 17:49:47.475	2025-11-03 12:57:46.334
2	admin	admin@horizonsourcing.com	$2a$10$mfuXEv4xG2NzuRlqAzav5uFwfJ9WpWtPTX/5UJ3Psy6o8wmz8pZOC	ADMIN	Admin	User	+1234567890	t	\N	2025-09-14 10:17:07.142	2025-11-03 12:57:45.811
28	procurementmanager	procurement.manager@horizonsourcing.com	$2a$10$D0T4r9YkdceMLfc2wg2CLu5lQSCeZS.sfsLNvyNF0rt3/SHRahCBW	PROCUREMENT_MANAGER	Procurement	Manager	\N	t	\N	2025-10-06 17:49:47.807	2025-11-03 12:57:46.432
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.categories_id_seq', 12, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.companies_id_seq', 7, true);


--
-- Name: goods_receipt_notes_grn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.goods_receipt_notes_grn_id_seq', 1, false);


--
-- Name: grn_items_grn_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.grn_items_grn_item_id_seq', 1, false);


--
-- Name: inventory_balances_balance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.inventory_balances_balance_id_seq', 1, true);


--
-- Name: inventory_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.inventory_categories_category_id_seq', 11, true);


--
-- Name: inventory_items_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.inventory_items_item_id_seq', 64, true);


--
-- Name: inventory_locations_location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.inventory_locations_location_id_seq', 5, true);


--
-- Name: inventory_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.inventory_logs_id_seq', 1, false);


--
-- Name: inventory_transactions_txn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.inventory_transactions_txn_id_seq', 252, true);


--
-- Name: invoices_invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.invoices_invoice_id_seq', 1, false);


--
-- Name: item_specifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.item_specifications_id_seq', 1, false);


--
-- Name: job_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.job_attachments_id_seq', 1, false);


--
-- Name: job_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.job_cards_id_seq', 82, true);


--
-- Name: job_lifecycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.job_lifecycles_id_seq', 15, true);


--
-- Name: materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.materials_id_seq', 91, true);


--
-- Name: prepress_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.prepress_activity_id_seq', 63, true);


--
-- Name: prepress_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.prepress_jobs_id_seq', 20, true);


--
-- Name: process_sequences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.process_sequences_id_seq', 9, true);


--
-- Name: process_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.process_steps_id_seq', 94, true);


--
-- Name: procurement_report_config_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.procurement_report_config_config_id_seq', 1, false);


--
-- Name: product_process_selections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.product_process_selections_id_seq', 57, true);


--
-- Name: product_step_selections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.product_step_selections_id_seq', 112, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.products_id_seq', 92, true);


--
-- Name: purchase_order_items_po_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.purchase_order_items_po_item_id_seq', 1, false);


--
-- Name: purchase_orders_po_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.purchase_orders_po_id_seq', 1, true);


--
-- Name: purchase_requisition_items_requisition_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.purchase_requisition_items_requisition_item_id_seq', 1, false);


--
-- Name: purchase_requisitions_requisition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.purchase_requisitions_requisition_id_seq', 1, true);


--
-- Name: ratio_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.ratio_reports_id_seq', 8, true);


--
-- Name: supplier_items_supplier_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.supplier_items_supplier_item_id_seq', 1, false);


--
-- Name: suppliers_supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.suppliers_supplier_id_seq', 5, true);


--
-- Name: system_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.system_config_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.users_id_seq', 35, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: goods_receipt_notes goods_receipt_notes_grn_number_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_notes
    ADD CONSTRAINT goods_receipt_notes_grn_number_key UNIQUE (grn_number);


--
-- Name: goods_receipt_notes goods_receipt_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_notes
    ADD CONSTRAINT goods_receipt_notes_pkey PRIMARY KEY (grn_id);


--
-- Name: grn_items grn_items_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.grn_items
    ADD CONSTRAINT grn_items_pkey PRIMARY KEY (grn_item_id);


--
-- Name: inventory_balances inventory_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_balances
    ADD CONSTRAINT inventory_balances_pkey PRIMARY KEY (balance_id);


--
-- Name: inventory_categories inventory_categories_department_master_category_control_cat_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_categories
    ADD CONSTRAINT inventory_categories_department_master_category_control_cat_key UNIQUE (department, master_category, control_category);


--
-- Name: inventory_categories inventory_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_categories
    ADD CONSTRAINT inventory_categories_pkey PRIMARY KEY (category_id);


--
-- Name: inventory_items inventory_items_item_code_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_item_code_key UNIQUE (item_code);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (item_id);


--
-- Name: inventory_locations inventory_locations_location_code_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_locations
    ADD CONSTRAINT inventory_locations_location_code_key UNIQUE (location_code);


--
-- Name: inventory_locations inventory_locations_location_name_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_locations
    ADD CONSTRAINT inventory_locations_location_name_key UNIQUE (location_name);


--
-- Name: inventory_locations inventory_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_locations
    ADD CONSTRAINT inventory_locations_pkey PRIMARY KEY (location_id);


--
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (txn_id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);


--
-- Name: item_specifications item_specifications_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.item_specifications
    ADD CONSTRAINT item_specifications_pkey PRIMARY KEY (id);


--
-- Name: job_attachments job_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_attachments
    ADD CONSTRAINT job_attachments_pkey PRIMARY KEY (id);


--
-- Name: job_cards job_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_cards
    ADD CONSTRAINT job_cards_pkey PRIMARY KEY (id);


--
-- Name: job_lifecycles job_lifecycles_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_lifecycles
    ADD CONSTRAINT job_lifecycles_pkey PRIMARY KEY (id);


--
-- Name: job_process_selections job_process_selections_jobId_processStepId_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_process_selections
    ADD CONSTRAINT "job_process_selections_jobId_processStepId_key" UNIQUE ("jobId", "processStepId");


--
-- Name: job_process_selections job_process_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_process_selections
    ADD CONSTRAINT job_process_selections_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: prepress_activity prepress_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_activity
    ADD CONSTRAINT prepress_activity_pkey PRIMARY KEY (id);


--
-- Name: prepress_jobs prepress_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_jobs
    ADD CONSTRAINT prepress_jobs_pkey PRIMARY KEY (id);


--
-- Name: process_sequences process_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.process_sequences
    ADD CONSTRAINT process_sequences_pkey PRIMARY KEY (id);


--
-- Name: process_steps process_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.process_steps
    ADD CONSTRAINT process_steps_pkey PRIMARY KEY (id);


--
-- Name: procurement_report_config procurement_report_config_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.procurement_report_config
    ADD CONSTRAINT procurement_report_config_pkey PRIMARY KEY (config_id);


--
-- Name: product_process_selections product_process_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product_process_selections
    ADD CONSTRAINT product_process_selections_pkey PRIMARY KEY (id);


--
-- Name: product_step_selections product_step_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product_step_selections
    ADD CONSTRAINT product_step_selections_pkey PRIMARY KEY (id);


--
-- Name: product_step_selections product_step_selections_productId_stepId_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product_step_selections
    ADD CONSTRAINT "product_step_selections_productId_stepId_key" UNIQUE ("productId", "stepId");


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (po_item_id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (po_id);


--
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- Name: purchase_requisition_items purchase_requisition_items_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition_items
    ADD CONSTRAINT purchase_requisition_items_pkey PRIMARY KEY (requisition_item_id);


--
-- Name: purchase_requisitions purchase_requisitions_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisitions
    ADD CONSTRAINT purchase_requisitions_pkey PRIMARY KEY (requisition_id);


--
-- Name: purchase_requisitions purchase_requisitions_requisition_number_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisitions
    ADD CONSTRAINT purchase_requisitions_requisition_number_key UNIQUE (requisition_number);


--
-- Name: ratio_reports ratio_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.ratio_reports
    ADD CONSTRAINT ratio_reports_pkey PRIMARY KEY (id);


--
-- Name: supplier_items supplier_items_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.supplier_items
    ADD CONSTRAINT supplier_items_pkey PRIMARY KEY (supplier_item_id);


--
-- Name: supplier_items supplier_items_supplier_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.supplier_items
    ADD CONSTRAINT supplier_items_supplier_id_item_id_key UNIQUE (supplier_id, item_id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (supplier_id);


--
-- Name: suppliers suppliers_supplier_code_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_supplier_code_key UNIQUE (supplier_code);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (id);


--
-- Name: inventory_balances uk_inventory_balances_item_location; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_balances
    ADD CONSTRAINT uk_inventory_balances_item_location UNIQUE (item_id, location_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: companies_name_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX companies_name_key ON public.companies USING btree (name);


--
-- Name: idx_grn_date; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_grn_date ON public.goods_receipt_notes USING btree (grn_date);


--
-- Name: idx_grn_number; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_grn_number ON public.goods_receipt_notes USING btree (grn_number);


--
-- Name: idx_grn_po; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_grn_po ON public.goods_receipt_notes USING btree (po_id);


--
-- Name: idx_grn_supplier; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_grn_supplier ON public.goods_receipt_notes USING btree (supplier_id);


--
-- Name: idx_inventory_balance_item; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_inventory_balance_item ON public.inventory_balances USING btree (item_id);


--
-- Name: idx_inventory_items_category; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_inventory_items_category ON public.inventory_items USING btree (category_id);


--
-- Name: idx_inventory_items_code; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_inventory_items_code ON public.inventory_items USING btree (item_code);


--
-- Name: idx_inventory_txn_date; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_inventory_txn_date ON public.inventory_transactions USING btree (txn_date);


--
-- Name: idx_inventory_txn_item; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_inventory_txn_item ON public.inventory_transactions USING btree (item_id);


--
-- Name: idx_invoices_date; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_invoices_date ON public.invoices USING btree (invoice_date);


--
-- Name: idx_invoices_number; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_invoices_number ON public.invoices USING btree (invoice_number);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_supplier; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_invoices_supplier ON public.invoices USING btree (supplier_id);


--
-- Name: idx_item_specifications_job_card_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_item_specifications_job_card_id ON public.item_specifications USING btree (job_card_id);


--
-- Name: idx_item_specifications_job_number; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_item_specifications_job_number ON public.item_specifications USING btree (job_number);


--
-- Name: idx_item_specifications_po_number; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_item_specifications_po_number ON public.item_specifications USING btree (po_number);


--
-- Name: idx_item_specifications_uploaded_at; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_item_specifications_uploaded_at ON public.item_specifications USING btree (uploaded_at);


--
-- Name: idx_job_process_selections_job_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_job_process_selections_job_id ON public.job_process_selections USING btree ("jobId");


--
-- Name: idx_prepress_jobs_ctp_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_prepress_jobs_ctp_status ON public.prepress_jobs USING btree (status) WHERE (status = ANY (ARRAY['QA_APPROVED'::text, 'PLATE_GENERATED'::text]));


--
-- Name: idx_prepress_jobs_plate_generated; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_prepress_jobs_plate_generated ON public.prepress_jobs USING btree (plate_generated);


--
-- Name: idx_purchase_orders_date; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_purchase_orders_date ON public.purchase_orders USING btree (po_date);


--
-- Name: idx_purchase_orders_number; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_purchase_orders_number ON public.purchase_orders USING btree (po_number);


--
-- Name: idx_purchase_orders_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_purchase_orders_status ON public.purchase_orders USING btree (status);


--
-- Name: idx_purchase_orders_supplier; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders USING btree (supplier_id);


--
-- Name: idx_purchase_req_date; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_purchase_req_date ON public.purchase_requisitions USING btree (requisition_date);


--
-- Name: idx_purchase_req_department; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_purchase_req_department ON public.purchase_requisitions USING btree (department);


--
-- Name: idx_purchase_req_number; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_purchase_req_number ON public.purchase_requisitions USING btree (requisition_number);


--
-- Name: idx_purchase_req_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_purchase_req_status ON public.purchase_requisitions USING btree (status);


--
-- Name: idx_ratio_reports_created_at; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_ratio_reports_created_at ON public.ratio_reports USING btree (created_at);


--
-- Name: idx_ratio_reports_job_card_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_ratio_reports_job_card_id ON public.ratio_reports USING btree (job_card_id);


--
-- Name: idx_supplier_items_item; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_supplier_items_item ON public.supplier_items USING btree (item_id);


--
-- Name: idx_supplier_items_preferred; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_supplier_items_preferred ON public.supplier_items USING btree (is_preferred);


--
-- Name: idx_supplier_items_supplier; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_supplier_items_supplier ON public.supplier_items USING btree (supplier_id);


--
-- Name: idx_suppliers_active; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_suppliers_active ON public.suppliers USING btree (is_active);


--
-- Name: idx_suppliers_code; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_suppliers_code ON public.suppliers USING btree (supplier_code);


--
-- Name: idx_suppliers_name; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (supplier_name);


--
-- Name: job_cards_jobNumber_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX "job_cards_jobNumber_key" ON public.job_cards USING btree ("jobNumber");


--
-- Name: job_lifecycles_jobCardId_processStepId_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX "job_lifecycles_jobCardId_processStepId_key" ON public.job_lifecycles USING btree ("jobCardId", "processStepId");


--
-- Name: materials_name_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX materials_name_key ON public.materials USING btree (name);


--
-- Name: process_sequences_name_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX process_sequences_name_key ON public.process_sequences USING btree (name);


--
-- Name: process_steps_sequenceId_stepNumber_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX "process_steps_sequenceId_stepNumber_key" ON public.process_steps USING btree ("sequenceId", "stepNumber");


--
-- Name: product_process_selections_productId_sequenceId_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX "product_process_selections_productId_sequenceId_key" ON public.product_process_selections USING btree ("productId", "sequenceId");


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: system_config_key_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX system_config_key_key ON public.system_config USING btree (key);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: inventory_balances fk_inventory_balances_item; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_balances
    ADD CONSTRAINT fk_inventory_balances_item FOREIGN KEY (item_id) REFERENCES public.inventory_items(item_id) ON DELETE CASCADE;


--
-- Name: inventory_balances fk_inventory_balances_location; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_balances
    ADD CONSTRAINT fk_inventory_balances_location FOREIGN KEY (location_id) REFERENCES public.inventory_locations(location_id) ON DELETE CASCADE;


--
-- Name: inventory_items fk_inventory_items_category; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT fk_inventory_items_category FOREIGN KEY (category_id) REFERENCES public.inventory_categories(category_id);


--
-- Name: inventory_transactions fk_inventory_transactions_item; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT fk_inventory_transactions_item FOREIGN KEY (item_id) REFERENCES public.inventory_items(item_id);


--
-- Name: inventory_transactions fk_inventory_transactions_location; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT fk_inventory_transactions_location FOREIGN KEY (location_id) REFERENCES public.inventory_locations(location_id);


--
-- Name: product_step_selections fk_product_step_selections_product; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product_step_selections
    ADD CONSTRAINT fk_product_step_selections_product FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_step_selections fk_product_step_selections_step; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product_step_selections
    ADD CONSTRAINT fk_product_step_selections_step FOREIGN KEY ("stepId") REFERENCES public.process_steps(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: goods_receipt_notes goods_receipt_notes_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_notes
    ADD CONSTRAINT goods_receipt_notes_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.inventory_locations(location_id);


--
-- Name: goods_receipt_notes goods_receipt_notes_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_notes
    ADD CONSTRAINT goods_receipt_notes_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id);


--
-- Name: goods_receipt_notes goods_receipt_notes_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_notes
    ADD CONSTRAINT goods_receipt_notes_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id);


--
-- Name: grn_items grn_items_grn_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.grn_items
    ADD CONSTRAINT grn_items_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES public.goods_receipt_notes(grn_id) ON DELETE CASCADE;


--
-- Name: grn_items grn_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.grn_items
    ADD CONSTRAINT grn_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(item_id);


--
-- Name: grn_items grn_items_po_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.grn_items
    ADD CONSTRAINT grn_items_po_item_id_fkey FOREIGN KEY (po_item_id) REFERENCES public.purchase_order_items(po_item_id);


--
-- Name: inventory_logs inventory_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT "inventory_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_grn_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES public.goods_receipt_notes(grn_id);


--
-- Name: invoices invoices_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id);


--
-- Name: invoices invoices_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id);


--
-- Name: item_specifications item_specifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.item_specifications
    ADD CONSTRAINT item_specifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: item_specifications item_specifications_job_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.item_specifications
    ADD CONSTRAINT item_specifications_job_card_id_fkey FOREIGN KEY (job_card_id) REFERENCES public.job_cards(id);


--
-- Name: job_attachments job_attachments_job_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_attachments
    ADD CONSTRAINT job_attachments_job_card_id_fkey FOREIGN KEY (job_card_id) REFERENCES public.job_cards(id) ON DELETE CASCADE;


--
-- Name: job_attachments job_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_attachments
    ADD CONSTRAINT job_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: job_cards job_cards_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_cards
    ADD CONSTRAINT "job_cards_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: job_cards job_cards_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_cards
    ADD CONSTRAINT "job_cards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: job_cards job_cards_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_cards
    ADD CONSTRAINT "job_cards_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: job_cards job_cards_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_cards
    ADD CONSTRAINT "job_cards_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: job_cards job_cards_qa_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_cards
    ADD CONSTRAINT job_cards_qa_approved_by_fkey FOREIGN KEY (qa_approved_by) REFERENCES public.users(id);


--
-- Name: job_cards job_cards_sequenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_cards
    ADD CONSTRAINT "job_cards_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES public.process_sequences(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: job_lifecycles job_lifecycles_jobCardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_lifecycles
    ADD CONSTRAINT "job_lifecycles_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES public.job_cards(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: job_lifecycles job_lifecycles_processStepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_lifecycles
    ADD CONSTRAINT "job_lifecycles_processStepId_fkey" FOREIGN KEY ("processStepId") REFERENCES public.process_steps(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: job_lifecycles job_lifecycles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_lifecycles
    ADD CONSTRAINT "job_lifecycles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: job_process_selections job_process_selections_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_process_selections
    ADD CONSTRAINT "job_process_selections_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.job_cards(id) ON DELETE CASCADE;


--
-- Name: job_process_selections job_process_selections_processStepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.job_process_selections
    ADD CONSTRAINT "job_process_selections_processStepId_fkey" FOREIGN KEY ("processStepId") REFERENCES public.process_steps(id) ON DELETE CASCADE;


--
-- Name: prepress_activity prepress_activity_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_activity
    ADD CONSTRAINT prepress_activity_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: prepress_activity prepress_activity_prepress_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_activity
    ADD CONSTRAINT prepress_activity_prepress_job_id_fkey FOREIGN KEY (prepress_job_id) REFERENCES public.prepress_jobs(id) ON DELETE CASCADE;


--
-- Name: prepress_jobs prepress_jobs_assigned_designer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_jobs
    ADD CONSTRAINT prepress_jobs_assigned_designer_id_fkey FOREIGN KEY (assigned_designer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: prepress_jobs prepress_jobs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_jobs
    ADD CONSTRAINT prepress_jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: prepress_jobs prepress_jobs_job_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_jobs
    ADD CONSTRAINT prepress_jobs_job_card_id_fkey FOREIGN KEY (job_card_id) REFERENCES public.job_cards(id) ON DELETE CASCADE;


--
-- Name: prepress_jobs prepress_jobs_plate_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_jobs
    ADD CONSTRAINT prepress_jobs_plate_generated_by_fkey FOREIGN KEY (plate_generated_by) REFERENCES public.users(id);


--
-- Name: prepress_jobs prepress_jobs_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.prepress_jobs
    ADD CONSTRAINT prepress_jobs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: process_steps process_steps_sequenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.process_steps
    ADD CONSTRAINT "process_steps_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES public.process_sequences(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_process_selections product_process_selections_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product_process_selections
    ADD CONSTRAINT "product_process_selections_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_process_selections product_process_selections_sequenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product_process_selections
    ADD CONSTRAINT "product_process_selections_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES public.process_sequences(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: purchase_order_items purchase_order_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(item_id);


--
-- Name: purchase_order_items purchase_order_items_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_requisition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.purchase_requisitions(requisition_id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id);


--
-- Name: purchase_requisition_items purchase_requisition_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition_items
    ADD CONSTRAINT purchase_requisition_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(item_id);


--
-- Name: purchase_requisition_items purchase_requisition_items_requisition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition_items
    ADD CONSTRAINT purchase_requisition_items_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.purchase_requisitions(requisition_id) ON DELETE CASCADE;


--
-- Name: ratio_reports ratio_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.ratio_reports
    ADD CONSTRAINT ratio_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: ratio_reports ratio_reports_job_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.ratio_reports
    ADD CONSTRAINT ratio_reports_job_card_id_fkey FOREIGN KEY (job_card_id) REFERENCES public.job_cards(id) ON DELETE CASCADE;


--
-- Name: supplier_items supplier_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.supplier_items
    ADD CONSTRAINT supplier_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(item_id) ON DELETE CASCADE;


--
-- Name: supplier_items supplier_items_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.supplier_items
    ADD CONSTRAINT supplier_items_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: erp_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict pabxhFSHECJ1pN5X7m6ejiTib931GzoftRpzHKS2ohLxXTz9CoROsTp90odU3Wt

